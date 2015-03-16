'use strict';

require('app')
  .directive('popoverFileExplorerFolderMenu', popoverFileExplorerFolderMenu);
/**
 * directive popoverFileExplorerFolderMenu
 * @ngInject
 */
function popoverFileExplorerFolderMenu(
  errs,
  $templateCache,
  $compile,
  $rootScope,
  $document,
  keypather,
  helperCreateFS
) {
  return {
    restrict: 'A',
    scope: false, // latch on to file-tree && file-tree-dir isolate scope isolate scopes
    link: function ($scope, element, attrs) {

      if ($scope.readOnly) {
        return;
      }

      var dirItemData = $scope.dirItemData = {};
      var actions = dirItemData.actions = {};
      var inputElement = element[0].querySelector('input.tree-input');
      dirItemData.editFolderName = false;

      dirItemData.eStyle = {
        top: '0px',
        left: '0px'
      };
      dirItemData.isOpen = false;

      actions.createFile = function () {
        helperCreateFS($scope.dir, {
          isDir: false
        }, errs.handler);
        closeModal();
      };

      actions.createFolder = function () {
        helperCreateFS($scope.dir, {
          isDir: true
        }, errs.handler);
        closeModal();
      };

      actions.deleteFolder = function () {
        $scope.dir.destroy(errs.handler);
        closeModal();
      };

      actions.renameFolder = function () {
        closeModal();
        dirItemData.editFolderName = true;
        inputElement.focus();
        inputElement.select();
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
        if (inputElement.value === $scope.dir.attrs.name) {
          return;
        }
        $scope.dir.rename(inputElement.value, errs.handler);
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

        $rootScope.$broadcast('app-document-click');
        $rootScope.$broadcast('file-modal-open');

        // insert element into dom
        var template = $templateCache.get('viewFileTreePopoverFileExplorerFolderMenu');
        var popoverElement = $compile(template)($scope);
        $document.find('body').append(popoverElement);
        $scope.$popoverTemplate = popoverElement;

        $scope.dirItemData.eStyle.top = e.pageY - 18 + 'px';
        $scope.dirItemData.eStyle.left = e.pageX + 'px';
        $scope.dirItemData.isOpen = true;

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
