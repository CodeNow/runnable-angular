require('app')
  .directive('popoverFileExplorerItemMenu', popoverFileExplorerItemMenu);
/**
 * directive popoverFileExplorerItemMenu
 * @ngInject
 */
function popoverFileExplorerItemMenu(
  $templateCache,
  $compile,
  $rootScope,
  jQuery,
  keypather
) {
  return {
    restrict: 'A',
    scope: false,
    link: function ($scope, element, attrs) {
      if ($scope.readOnly) {
        return;
      }

      $scope.jQuery = jQuery;
      var inputElement = element.find('input');
      inputElement.on('blur', function () {
        closeFileNameInput();
      });

      var fileItemData =$scope.fileItemData = {};
      var actions = fileItemData.actions = {};
      fileItemData.editFileName = false;

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
        fileItemData.editFileName = true;
        inputElement[0].focus();
        inputElement[0].select();
      };
      actions.deleteFile = function () {};

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
        fileItemData.editFileName = false;
      }

      function closeModal() {
        if (fileItemData.isOpen) {
          fileItemData.isOpen = false;
        }
        if (keypather.get($scope, '$popoverTemplate.remove')) {
          $scope.$popoverTemplate.remove();
        }
      }

      element[0].addEventListener('contextmenu', contextMenuListener);
      function contextMenuListener (e){
        if (e.currentTarget !== e.target) {
          return false;
        }

        $rootScope.$broadcast('file-modal-open');

        var template = $templateCache.get('viewFileTreePopoverFileItemMenu');
        var $template = angular.element(template);
        $compile($template)($scope);
        $scope.$popoverTemplate = $scope.jQuery($template);
        $scope.jQuery('body').append($template);

        $scope.fileItemData.eStyle.top = e.pageY - 18 + 'px';
        $scope.fileItemData.eStyle.left = e.pageX + 'px';
        $scope.fileItemData.isOpen = true;

        $rootScope.safeApply();

        e.preventDefault();
        e.stopPropagation();
      }
      element.on('$destroy', function () {
        inputElement.off('blur');
        $scope.$popoverTemplate.remove();
        element[0].removeEventListener('contextmenu', contextMenuListener);
      });

    }
  };
}
