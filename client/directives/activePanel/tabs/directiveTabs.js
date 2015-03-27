'use strict';

require('app')
  .directive('tabs', tabs);
/**
 * tabs Directive
 * @ngInject
 */
function tabs(
  $state,
  colorScheme,
  $rootScope
) {
  return {
    restrict: 'A',
    templateUrl: 'viewTabs',
    scope: {
      openItems: '='
    },
    link: function ($scope) {
      $scope.state = $state;
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
