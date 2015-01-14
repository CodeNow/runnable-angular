'use strict';

require('app')
  .directive('popoverFileExplorerMenu', popoverFileExplorerMenu);
/**
 * directive popoverFileExplorerMenu
 * @ngInject
 */
function popoverFileExplorerMenu(
  errs,
  $templateCache,
  $compile,
  $rootScope,
  jQuery,
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

      $scope.jQuery = jQuery;

      var dirItemData = $scope.dirItemData = {};
      var actions = dirItemData.actions = {};
      var inputElement = jQuery(element).find('> input.tree-input');
      dirItemData.editFolderName = false;

      dirItemData.eStyle = {
        top: '0px',
        left: '0px'
      };
      dirItemData.isOpen = false;

      actions.createFile = function () {
        var file = helperCreateFS($scope.dir, {
          isDir: false
        }, function (err) {
          if (err) {
            throw err;
          }
        });
        closeModal();
      };

      actions.createFolder = function () {
        var dir = helperCreateFS($scope.dir, {
          isDir: true
        }, function (err) {
          if (err) {
            throw err;
          }
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
        if (inputElement.val() === $scope.dir.attrs.name) {
          return;
        }
        var cachedName = $scope.dir.attrs.name;
        $scope.dir.rename(inputElement.val(), errs.handler);

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
        var template = $templateCache.get('viewFileTreePopoverFileExplorerMenu');
        var $template = angular.element(template);
        $compile($template)($scope);
        $scope.$popoverTemplate = $scope.jQuery($template);
        $scope.jQuery('body').append($template);

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
