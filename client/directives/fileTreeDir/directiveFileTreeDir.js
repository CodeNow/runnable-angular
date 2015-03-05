'use strict';

require('app')
  .directive('fileTreeDir', fileTreeDir);
/**
 * fileTreeDir Directive
 * @ngInject
 */
function fileTreeDir(
  $templateCache,
  $compile,
  $rootScope,
  $state,
  keypather,
  errs,
  $q,
  promisify
) {
  return {
    restrict: 'E',
    scope: {
      dir: '=',
      parentDir: '=',
      fileModel: '=',
      openItems: '=',
      readOnly: '='
    },
    template: '',
    //templateUrl: 'viewFileTreeDir',
    link: function ($scope, element, attrs) {

      var actions = $scope.actions = {};
      var data = $scope.data = {};
      $scope.state = $state;

      $scope.actions.drop = function (dataTransfer, toDir) {
        var modelType = dataTransfer.getData('modelType');
        var model = JSON.parse(dataTransfer.getData('model'));
        var modelName = dataTransfer.getData('modelName');

        var oldParentDirModel = JSON.parse(dataTransfer.getData('oldParentDir'));
        var oldPath = dataTransfer.getData('oldPath');
        var thisPath = toDir.id();
        if (oldPath === thisPath || (modelType === 'Dir' &&
            thisPath.indexOf(modelName + '/') >= 0)) {
          return false;
        }

        var newModel = $scope.fileModel['new' + modelType](model, { warn: false });
        var droppedFileOrigDir = $scope.fileModel.newDir(oldParentDirModel, { warn: false });

        promisify(newModel, 'moveToDir')(toDir).then(function () {
          return $q.all([
            promisify(droppedFileOrigDir.contents, 'fetch')(),
            promisify(toDir.contents, 'fetch')()
          ]);
        });
      };


      actions.closeOpenModals = function () {
        $rootScope.$broadcast('app-document-click');
      };

      actions.openFile = function (file) {
        $scope.openItems.add(file);
      };

      // http://www.bennadel.com/blog/2495-user-friendly-sort-of-alpha-numeric-data-in-javascript.htm
      function normalizeMixedDataValue(file) {
        var padding = '000000000000000';
        // Loop over all numeric values in the string and
        // replace them with a value of a fixed-width for
        // both leading (integer) and trailing (decimal)
        // padded zeroes.
        var value = file.attrs.name.replace(
          /(\d+)((\.\d+)+)?/g,
          function ($0, integer, decimal, $3) {
            if (decimal !== $3) {
              return (
                padding.slice(integer.length) +
                integer +
                decimal
              );
            }
            decimal = (decimal || '.0');
            return (
              padding.slice(integer.length) +
              integer +
              decimal +
              padding.slice(decimal.length)
            );
          }
        );
        return value;
      }
      actions.normalizeMixedDataValue = normalizeMixedDataValue;

      function fetchDirFiles(file) {
        promisify($scope.dir.contents, 'fetch')().then(function () {
          if (file) {
            keypather.set(file, 'state.renaming', true);
          }
        }).catch(errs.handler);
      }
      actions.fetchDirFiles = fetchDirFiles;
      $scope.$watch('dir.state.open', function (newVal, oldval) {
        if (newVal) {
          fetchDirFiles();
        }
      });

      //avoid infinite loop w/ nested directories
      var template = $templateCache.get('viewFileTreeDir');
      var $template = angular.element(template);
      $compile($template)($scope);
      element.replaceWith($template);

      element.on('$destroy', function () {
        // IF BIND ANY EVENTS TO DOM, UNBIND HERE OR SUFFER THE MEMORY LEAKS
      });
    }
  };
}
