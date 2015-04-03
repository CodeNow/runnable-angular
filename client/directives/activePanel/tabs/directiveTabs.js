'use strict';

require('app')
  .directive('tabs', tabs);
/**
 * tabs Directive
 * @ngInject
 */
function tabs(
  colorScheme,
  helperAddTab,
  $rootScope
) {
  return {
    restrict: 'A',
    templateUrl: 'viewTabs',
    scope: {
      openItems: '=',
      instance: '=',
      showAddButtons: '='
    },
    link: function ($scope) {
      $scope.popoverAddTab = helperAddTab($scope.showAddButtons, $scope.openItems);
      $scope.actions = {
        removeItem: function (event, item) {
          $scope.openItems.remove(item);

          //We need to stop propagation, so we need to manually trigger close-popovers
          $rootScope.$broadcast('close-popovers');
          event.stopPropagation();
        }
      };
      $scope.data = {};
      $scope.colorScheme = colorScheme;
    }
  };
}
