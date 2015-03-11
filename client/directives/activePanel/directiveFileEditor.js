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
  debounce,
  keypather,
  modelist,
  promisify,
  errs,
  $rootScope
) {
  return {
    restrict: 'A',
    templateUrl: 'viewFileEditor',
    scope: {
      file: '=',
      toggleTheme: '='
    },
    link: function ($scope, element, attrs) {

      var actions = $scope.actions = {};

      actions.setAceMode = function (_editor) {
        var name = keypather.get($scope, 'file.attrs.name');
        if (name) {
          var mode = modelist.getModeForPath(name).mode;
          _editor.getSession().setMode(mode);
        }
      };

      actions.onFocus = function () {
        $rootScope.$broadcast('app-document-click');
      };

      function resetFileBodyState() {
        $scope.file.state.body = $scope.file.attrs.body;
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
        return promisify($scope.file, 'update')({
          json: {
            body: $scope.state.body
          }
        }).then(function () {
          delete $scope.file.state.isDirty;
        }).catch(
          errs.handler
        ).finally(function () {
          $scope.loading = false;
        });
      }
      var updateFileDebounce = debounce(updateFile, 333);

      var fileUnwatch = $scope.$watch('file', function (n) {
        if (n) {
          fileUnwatch();
          fetchFile().then(function () {
            // Send the updateFile promise up to the parent
            $scope.$emit('FETCH_FILE_SUCCESSFUL', n, updateFile);
          });
        }
      });

      $scope.$watch('state.body', function (newVal) {
        if (typeof newVal === 'string') {
          $scope.file.state.isDirty = true;
          if (attrs.useAutoUpdate) {
            updateFileDebounce();
          }
        }
      });
    }

  };
}
