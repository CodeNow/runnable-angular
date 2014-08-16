require('app')
  .directive('popoverFileExplorerMenu', popoverFileExplorerMenu);
/**
 * directive popoverFileExplorerMenu
 * @ngInject
 */
function popoverFileExplorerMenu(
  $templateCache,
  $compile,
  $rootScope,
  jQuery,
  keypather,
  getNewFileFolderName
) {
  return {
    restrict: 'A',
    scope: false, // latch on to file-tree && file-tree-dir isolate scope isolate scopes
    link: function ($scope, element, attrs) {

      if ($scope.readOnly) {
        return;
      }

      $scope.jQuery = jQuery;

      var dirItemData = $scope.dirItemData = {};
      var actions = dirItemData.actions = {};
      dirItemData.editFolderName = false;

      dirItemData.eStyle = {
        top: '0px',
        left: '0px'
      };
      dirItemData.isOpen = false;

      actions.getNewName = function () {
        return getNewFileFolderName($scope.dir);
      };

      actions.createFile = function () {
        var name = this.getNewName();
        $scope.dir.contents.create({
          name: name,
          isDir: false
        }, function () {
          $scope.actions.fetchDirFiles();
        });

        closeModal();
      };

      actions.createFolder = function () {
        var name = this.getNewName();
        $scope.dir.contents.create({
          name: name,
          isDir: true
        }, function () {
          $scope.actions.fetchDirFiles();
        });
        closeModal();
      };

      actions.deleteFolder = function () {
        $scope.dir.destroy(function (err) {
          if (err) {
            throw err;
          }
        });
        closeModal();
      };

      actions.renameFolder = function () {
        closeModal();
        dirItemData.editFolderName = true;
        inputElement[0].focus();
        inputElement[0].select();
      };

      $scope.$on('file-modal-open', function () {
        closeModal();
        closeFolderNameInput();
      });

      $scope.$on('app-document-click', function () {
        closeModal();
        closeFolderNameInput();
      });

      dirItemData.actions.closeFolderNameInput = closeFolderNameInput;

      function closeFolderNameInput() {
        if (!dirItemData.editFolderName) {
          return;
        }
        dirItemData.editFolderName = false;
        if (inputElement.val() === $scope.fs.attrs.name) {
          return;
        }
        var cachedName = $scope.dir.attrs.name;
        $scope.dir.rename(inputElement.val(), function (err) {
          if (err) {
            $rootScope.safeApply();
            throw err;
          }
          console.log('sorting dir');
          $scope.actions.sortDir();
        });

        //ex
        /*
        $scope.dirReceiving;
        $scope.dir.moveToDir($scope.dirReceiving, function () {
          $scope.safeApply();
        });
        $scope.safeApply();
        */

      }

      function closeModal() {
        if (dirItemData.isOpen) {
          dirItemData.isOpen = false;
        }
        if (keypather.get($scope, '$popoverTemplate.remove')) {
          $scope.$popoverTemplate.remove();
        }
      }

      element[0].addEventListener('contextmenu', contextMenuListener);

      // dynamically creates and inserts DOM element
      function contextMenuListener(e) {
        if (e.currentTarget !== e.target) {
          return false;
        }

        $rootScope.$broadcast('file-modal-open');

        // insert element into dom
        var template = $templateCache.get('viewFileTreePopoverFileExplorerMenu');
        var $template = angular.element(template);
        $compile($template)($scope);
        $scope.$popoverTemplate = $scope.jQuery($template);
        $scope.jQuery('body').append($template);

        $scope.dirItemData.eStyle.top = e.pageY - 18 + 'px';
        $scope.dirItemData.eStyle.left = e.pageX + 'px';
        $scope.dirItemData.isOpen = true;

        $rootScope.safeApply();

        e.preventDefault();
        e.stopPropagation();
      }

      $scope.$on('$destroy', function () {
        if (keypather.get($scope, '$popoverTemplate.remove')) {
          $scope.$popoverTemplate.remove();
        }
        element[0].removeEventListener('contextmenu', contextMenuListener);
      });

    }
  };
}
