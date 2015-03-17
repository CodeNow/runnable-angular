'use strict';

require('app')
  .directive('popoverFileExplorerItemMenu', popoverFileExplorerItemMenu);
/**
 * directive popoverFileExplorerItemMenu
 * @ngInject
 */
function popoverFileExplorerItemMenu(
  errs,
  $templateCache,
  $compile,
  $rootScope,
  $document,
  keypather
) {
  return {
    restrict: 'A',
    scope: false,
    link: function ($scope, element, attrs) {
      if ($scope.readOnly) {
        return;
      }

      var inputElement = element.find('input');
      inputElement.on('blur', function () {
        closeFileNameInput();
      });

      var fileItemData = $scope.fileItemData = {};
      var actions = fileItemData.actions = {};
      if (!$scope.fs.state) {
        $scope.fs.state = {};
      }

      fileItemData.eStyle = {
        top: '0px',
        left: '0px'
      };
      fileItemData.isOpen = false;

      actions.openFile = function () {
        $scope.openItems.add($scope.fs);
        closeModal();
      };

      actions.renameFile = function () {
        closeModal();
        $scope.fs.state.renaming = true;
      };

      actions.deleteFile = function () {
        $scope.fs.destroy(function (err) {
          errs.handler(err);
          // destroy alone does not update collection
          $scope.actions.fetchDirFiles();
        });
        closeModal();
      };

      // insert element into dom
      $scope.$on('file-modal-open', function () {
        closeModal();
        closeFileNameInput();
      });

      $scope.$on('app-document-click', function () {
        closeModal();
        closeFileNameInput();
      });

      function closeFileNameInput() {
        if (!keypather.get($scope, 'fs.state.renaming')) {
          return;
        }
        $scope.fs.state.renaming = false;
        if (inputElement.val() === $scope.fs.attrs.name) {
          return;
        }
        $scope.fs.rename(inputElement.val(), errs.handler);
      }
      fileItemData.actions.closeFileNameInput = closeFileNameInput;

      function closeModal() {
        if (fileItemData.isOpen) {
          fileItemData.isOpen = false;
        }
        if (keypather.get($scope, '$popoverTemplate.remove')) {
          $scope.$popoverTemplate.remove();
        }
      }

      element[0].addEventListener('contextmenu', contextMenuListener);

      function contextMenuListener(e) {
        if (e.currentTarget !== e.target) {
          return false;
        }

        $rootScope.$broadcast('file-modal-open');
        $rootScope.$broadcast('app-document-click');

        var template = $templateCache.get('viewFileTreePopoverFileItemMenu');

        var popoverElement = $compile(template)($scope);
        $document.find('body').append(popoverElement);
        $scope.$popoverTemplate = popoverElement;

        $scope.fileItemData.eStyle.top = e.pageY - 18 + 'px';
        $scope.fileItemData.eStyle.left = e.pageX + 'px';
        $scope.fileItemData.isOpen = true;

        e.preventDefault();
        e.stopPropagation();
      }
      $scope.$on('$destroy', function () {
        inputElement.off('blur');
        if (keypather.get($scope, '$popoverTemplate.remove')) {
          $scope.$popoverTemplate.remove();
        }
        element[0].removeEventListener('contextmenu', contextMenuListener);
      });

    }
  };
}
