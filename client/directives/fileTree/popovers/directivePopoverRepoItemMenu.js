require('app')
  .directive('popoverRepoItemMenu', popoverRepoItemMenu);
/**
 * directive popoverRepoItemMenu
 * @ngInject
 */
function popoverRepoItemMenu(
  $templateCache,
  $compile,
  $timeout,
  $rootScope,
  jQuery,
  keypather
) {
  return {
    restrict: 'A',
    scope: false, // latch on to file-tree && file-tree-dir isolate scope isolate scopes
    // scope: {},
    link: function ($scope, element, attrs) {

      $scope.jQuery = jQuery;

      var popoverData = $scope.popoverData = {};
      var actions = popoverData.actions = {};

      actions.modify = function () {
        keypather.set($scope, 'repoModel.state.editing', true);
        popoverData.isOpen = false;
        var input = jQuery(element).find('> input.tree-input')[0];
        input.focus();
        input.select();
      };

      actions.remove = function () {
        $scope.repoModel.destroy(function () {
          $rootScope.safeApply();
        });
        $rootScope.safeApply();
      };

      popoverData.eStyle = {
        top: '0px',
        left: '0px'
      };
      popoverData.isOpen = false;

      // insert element into dom
      var template = $templateCache.get('viewFileTreePopoverRepoItemMenu');
      var $template = angular.element(template);
      $compile($template)($scope);
      $scope.$popoverTemplate = $scope.jQuery($template);
      //element.prepend($template);
      $scope.jQuery('body').append($template);

      $scope.$on('file-modal-open', function () {
        if (popoverData.isOpen) {
          popoverData.isOpen = false;
        }
      });
      $scope.$on('app-document-click', function () {
        if (popoverData.isOpen) {
          popoverData.isOpen = false;
        }
      });

      popoverData.actions.exit = exit;
      function exit () {
        popoverData.isOpen = false;
        keypather.set($scope, 'repoModel.state.editing', false);
        // TODO
        // Save changes
      }
      $scope.$on('file-modal-open', exit);
      $scope.$on('app-document-click', exit);

      element[0].addEventListener('contextmenu', contextMenuListener);
      function contextMenuListener(e) {
        $rootScope.$broadcast('app-document-click');
        $rootScope.$broadcast('file-modal-open');

        $scope.popoverData.eStyle.top = e.pageY - 18 + 'px';
        $scope.popoverData.eStyle.left = e.pageX + 'px';
        $scope.popoverData.isOpen = true;

        $timeout(function () {
          $scope.$apply();
        });

        e.preventDefault();
        e.stopPropagation();
      }
      element.on('$destroy', function () {
        if (keypather.get($scope, '$popoverTemplate.remove')) {
          $scope.$popoverTemplate.remove();
        }
        element[0].removeEventListener('contextmenu', contextMenuListener);
      });

    }
  };
}
