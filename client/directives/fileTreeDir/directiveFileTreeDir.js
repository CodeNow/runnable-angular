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
  promisify,
  helperCreateFS
) {
  return {
    restrict: 'A',
    replace: true,
    scope: {
      dir: '=',
      parentDir: '=',
      fileModel: '=', // This is either a contextVersion or a container
      openItems: '=',
      readOnly: '='
    },
    templateUrl: 'viewFileTreeDir',
    link: function ($scope, element, attrs) {

      var actions = $scope.actions = {};
      var data = $scope.data = {};
      var inputElement;

      $scope.editFolderName = false;
      $scope.editFileName = false;
      $scope.data = {};
      $scope.state = $state;

      $scope.actions.closeFolderNameInput = function () {
        if (!$scope.editFolderName) {
          return;
        }
        $scope.editFolderName = false;
        if (inputElement.value === $scope.dir.attrs.name) {
          return;
        }
        $scope.dir.rename(inputElement.value, errs.handler);
      };

      $scope.actions.closeFileNameInput = function (event, file) {
        if (!file.state.renaming) {
          return;
        }
        file.state.renaming = false;
        if (event.currentTarget.value === file.attrs.name) {
          return;
        }
        file.rename(event.currentTarget.value, errs.handler);
      };

      $scope.actions.drop = function (dataTransfer, toDir) {
        var modelType = dataTransfer.getData('modelType');
        var modelId = dataTransfer.getData('modelId');
        var modelName = dataTransfer.getData('modelName');

        var oldParentDirId = dataTransfer.getData('oldParentDirId');
        var oldPath = dataTransfer.getData('oldPath');
        var thisPath = toDir.id();
        if (oldPath === thisPath || (modelType === 'Dir' &&
            thisPath.indexOf(modelName + '/') >= 0)) {
          return false;
        }

        var newModel = $scope.fileModel['new' + modelType](modelId, { warn: false, noStore: true });
        var droppedFileOrigDir =
            $scope.fileModel.newDir(oldParentDirId, { warn: false, noStore: true });

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

      actions.handleClickOnInput = function (event, file) {
        if (file.state.renaming) {
          event.preventDefault();
          event.stopPropagation();
        }
      };

      actions.openFile = function (file) {
        $scope.openItems.add(file);
      };

      $scope.popoverFileExplorerFolder = {
        show: false,
        options: {
          top: -16,
          left: 10
        },
        actions: {
          createFile: function () {
            helperCreateFS($scope.dir, {
              isDir: false
            }, errs.handler);
            $scope.$broadcast('close-popovers');
          },
          createFolder: function () {
            helperCreateFS($scope.dir, {
              isDir: true
            }, errs.handler);
            $scope.$broadcast('close-popovers');
          },
          renameFolder: function () {
            $scope.editFolderName = true;
            inputElement.focus();
            inputElement.select();
            $scope.$broadcast('close-popovers');
          },
          deleteFolder: function () {
            $scope.dir.destroy(errs.handler);
            $scope.$broadcast('close-popovers');
          }
        }
      };

      $scope.popoverFileExplorerFile = {
        options: {
          top: -16,
          left: 10
        },
        actions: {
          openFile: function (file) {
            $scope.openItems.add(file);
            $scope.$broadcast('close-popovers');
          },
          renameFile: function (file) {
            keypather.set(file,'state.renaming', true);
            $scope.$broadcast('close-popovers');
          },
          deleteFile: function (file) {
            file.destroy(function (err) {
              errs.handler(err);
              // destroy alone does not update collection
              $scope.actions.fetchDirFiles();
            });
            $scope.$broadcast('close-popovers');
          }
        }
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
      $scope.$watch('dir.state.open', function (newVal) {
        if (newVal) {
          fetchDirFiles();
        }
      });

      //avoid infinite loop w/ nested directories
      var template = $templateCache.get('viewFileTreeDir');
      var $template = angular.element(template);
      var compiled = $compile($template)($scope);
      element.replaceWith(compiled);
      inputElement = compiled[0].querySelector('input.tree-input');
    }
  };
}
