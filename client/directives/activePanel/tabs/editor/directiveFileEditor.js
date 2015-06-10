'use strict';

require('brace');
require('brace/ext/modelist');
require('brace/ext/searchbox');
require('lib/braceModes');

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
      useAutoUpdate: '=',
      loadingPromisesTarget: '@?'
    },
    link: function ($scope, element, attrs) {
      var useValidation = false;
      var session = null;
      $scope.actions = {
        setAceMode: function (editor) {
          var unwatch = $scope.$watch('file.attrs.name', function (name) {
            if (name) {
              unwatch();
              var mode = modelist.getModeForPath(name).mode;
              editor.getSession().setMode(mode);
              session = editor.getSession();
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
        $scope.loading = true;
        return promisify(
          $scope.file,
          'fetch'
        )().then(function () {
          resetFileBodyState();
        }).catch(
          errs.handler
        ).finally(function () {
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

      var fileUnwatch = $scope.$watch('file', function (n) {
        if (n) {
          fileUnwatch();
          useValidation = n.attrs.name === 'Dockerfile';
          keypather.set(n, 'state.isDirty', false);
          $scope.$on('EDITOR::SAVE', updateFile);
          if (!$scope.useAutoUpdate) {
            keypather.set($scope.file, 'actions.saveChanges', updateFile);
          }

          fetchFile().then(function () {
            $scope.$watch('file.state.body', function (newVal) {
              if (typeof newVal === 'string' &&
                  newVal !== $scope.file.attrs.body) {
                if (useValidation) {
                  var validation = validateDockerfile(newVal);
                  if (validation.errors) {
                    validation.errors = validation.errors.filter(function (error) {
                      return error.line;
                    });
                    validation.criticals = validation.errors.filter(function (error) {
                      return error.priority === 0;
                    });
                    $scope.file.validation = validation;
                    var annotations = validation.errors.map(function (error) {
                      return {
                        text: error.message,
                        type: error.priority === 0 ? 'error' : 'warning',
                        row: error.line - 1
                      };
                    });
                    session.setAnnotations(annotations);
                  } else {
                    $scope.file.validation = {};
                  }
                }
                keypather.set($scope.file, 'state.isDirty', true);
                if ($scope.useAutoUpdate) {
                  updateFileDebounce();
                }
              }
              // Send the updateFile promise up to the parent
              $scope.$emit('FETCH_FILE_SUCCESSFUL', n, updateFile);
            });
          });
        }
      });
    }

  };
}
