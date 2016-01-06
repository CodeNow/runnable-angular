'use strict';

require('app')
  .directive('fileEditor', fileEditor);
/**
 * fileEditor Directive
 * @ngInject
 */
function fileEditor(
  $rootScope,
  debounce,
  errs,
  keypather,
  hasKeypaths,
  modelist,
  promisify,
  loadingPromises,
  validateDockerfile
) {
  return {
    restrict: 'A',
    templateUrl: 'viewFileEditor',
    scope: {
      file: '=',
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
                updateDockerfileValidation($scope.file);
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
        $scope.loading = true;
        return promisify($scope.file, 'fetch')()
          .then(resetFileBodyState)
          .catch(function (error) {
            $scope.hasError = true;
            errs.report(error);
          })
          .finally(function () {
            $scope.loading = false;
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

      function updateDockerfileValidation() {
        var isDockerfile = $scope.file.attrs.name === 'Dockerfile';
        if (!isDockerfile) {
          return;
        }

        var body = $scope.file.state ? $scope.file.state.body : $scope.file.attrs.body;
        var validation = validateDockerfile(body);
        if (validation.errors) {
          validation.errors = validation.errors.filter(function (error) {
            return error.line;
          });
          validation.criticals = validation.errors.filter(hasKeypaths({
            'priority' : 0
          }));
          $scope.file.validation = validation;
          if (session) {
            var annotations = validation.errors.map(function (error) {
              return {
                text: error.message,
                type: error.priority === 0 ? 'error' : 'warning',
                row: error.line - 1
              };
            });
            session.setAnnotations(annotations);
          }
        } else {
          $scope.file.validation = {};
        }
      }

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
                updateDockerfileValidation($scope.file);
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
