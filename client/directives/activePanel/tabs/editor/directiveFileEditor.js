'use strict';

require('app')
  .directive('fileEditor', fileEditor);
/**
 * fileEditor Directive
 * @ngInject
 */
function fileEditor(
  $q,
  $rootScope,
  debounce,
  errs,
  keypather,
  modelist,
  promisify,
  loadingPromises
) {
  return {
    restrict: 'A',
    templateUrl: 'viewFileEditor',
    scope: {
      file: '=',
      instance: '=?',
      loadingPromisesTarget: '@?',
      readOnly: '=?',
      useAutoUpdate: '=?'
    },
    link: function ($scope, element, attrs) {
      var useValidation = false;
      var session = null;
      $scope.protectedText = 'The contents of this file are protected and cannot be shown';
      $scope.actions = {
        setAceMode: function (editor) {
          var unwatch = $scope.$watch('file.state.body', function (body) {
            if (typeof body === 'string') {
              unwatch();
              modelist.then(function (modelist) {
                var mode = modelist.getModeForPath($scope.file.attrs.name).mode;
                editor.getSession().setMode(mode);
                session = editor.getSession();
              });
            }
          });
        },
        onFocus: function () {
          $rootScope.$broadcast('app-document-click');
        }
      };

      function resetFileBodyState() {
        keypather.set($scope.file, 'state.body', $scope.file.attrs.body);
        if (useValidation) {
          $scope.file.validation = {};
        }
      }

      function fetchFile() {
        delete $scope.hasError;
        // If the file is a remote copy, or it has changes, for the love of god... DON'T UPDATE!!
        // All of the changes will be deleted
        if ($scope.readOnly && (keypather.get($scope.file, 'attrs.isRemoteCopy') || keypather.get($scope.file, 'state.body'))) {
          return $q.when(true);
        }
        $scope.loading = true;
        return promisify($scope.file, 'fetch')()
          .then(resetFileBodyState)
          .catch(function (error) {
            if (keypather.get(error, 'data.res.statusCode') === 413) {
              $scope.hasError = 'tooLarge';
            } else {
              $scope.hasError = 'failure';
            }
            errs.report(error);
          })
          .finally(function () {
            $scope.loading = false;
          });
      }

      if ($scope.instance) {
        $scope.$watch('instance.isMigrating()', function (isMigrating, wasMigrating) {
          if (!isMigrating && wasMigrating) {
            // If we were migrating, but just finished, we need to re-fetch these files
            var backupChanges = keypather.get($scope.file, 'state.body');
            fetchFile()
              .then(function () {
                if (!$scope.hasError && backupChanges) {
                  keypather.set($scope.file, 'state.body', backupChanges);
                }
              });
          } else if (isMigrating) {
            $scope.hasError = 'migrating';
          }
        });
      }

      function updateFile() {
        var thisBodyChange = $scope.file.state.body;
        return loadingPromises.add($scope.loadingPromisesTarget, promisify($scope.file, 'update'))({
          json: {
            body: $scope.file.state.body
          }
        }).then(function () {
          // If this promise flow is still the most recent update, set dirty to false
          if (thisBodyChange === $scope.file.state.body) {
            keypather.set($scope.file, 'state.isDirty', false);
          }
        }).catch(
          errs.handler
        );
      }
      var updateFileDebounce = debounce(updateFile, 1000);

      var fileBodyWatch = angular.noop;
      $scope.$watch('file', function (file) {
        if (!file) {
          return;
        }
        keypather.set(file, 'state.isDirty', false);
        if (!$scope.useAutoUpdate) {
          keypather.set(file, 'actions.saveChanges', updateFile);
        }
        return fetchFile()
          .then(function () {
            fileBodyWatch();
            fileBodyWatch = $scope.$watch('file.state.body', function (newVal) {
              // We should never get undefined back unless a fresh value from the server has been loaded
              if (newVal === undefined) {
                resetFileBodyState();
              } else if (typeof newVal === 'string' && newVal !== $scope.file.attrs.body) {
                keypather.set($scope.file, 'state.isDirty', true);
                if ($scope.useAutoUpdate) {
                  updateFileDebounce();
                }
              }
              // Send the updateFile promise up to the parent
              $scope.$emit('FETCH_FILE_SUCCESSFUL', file, updateFile);
            });
          });
      });
    }

  };
}
