require('app')
  .directive('popoverFileExplorerItemMenu', popoverFileExplorerItemMenu);
/**
 * directive popoverFileExplorerItemMenu
 * @ngInject
 */
function popoverFileExplorerItemMenu(
  $templateCache,
  jQuery
) {
  return {
    restrict: 'A',
    scope: false,
    link: function ($scope, element, attrs) {

      $scope.jQuery = jQuery;
      if ($scope.readOnly) {
        return;
      }

      var fileItemData =$scope.fileItemData = {};
      var actions = fileItemData.actions = {};

      fileItemData.eStyle = {
        top: '0px',
        left: '0px'
      };
      fileItemData.isOpen = false;

      // insert element into dom
      var template = $templateCache.get('viewFileTreePopoverFileExplorerItemMenu');
      var $template = angular.element(template);
      $compile($template)($scope);
      $scope.$popoverTemplate = $scope.jQuery($template);
      $scope.jQuery('body').append($template);

      $scope.$on('file-modal-open', function () {
        if (fileItemData.isOpen) {
          fileItemData.isOpen = false;
        }
      });
      $scope.$on('app-document-click', function () {
        if (fileItemData.isOpen) {
          fileItemData.isOpen = false;
        }
      });

      element[0].addEventListener('contextmenu', contextMenuListener);
      function contextMenuListener (e){
        if (e.currentTarget !== e.target) {
          return false;
        }
        $scope.dPFEMenu.eStyle.top = e.pageY - 18 + 'px';
        $scope.dPFEMenu.eStyle.left = e.pageX + 'px';
        $scope.dPFEMenu.isOpen = true;

        $rootScope.safeApply();

        e.preventDefault();
        e.stopPropagation();
      }
      element.on('$destroy', function () {
        $scope.$popoverTemplate.remove();
        element[0].removeEventListener('contextmenu', contextMenuListener);
      });

    }
  };
}
