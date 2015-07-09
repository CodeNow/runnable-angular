'use strict';

require('app')
  .directive('tabs', tabs);
/**
 * tabs Directive
 * @ngInject
 */
function tabs(
  $rootScope
) {
  return {
    restrict: 'A',
    templateUrl: 'viewTabs',
    scope: {
      openItems: '=',
      showAddButtons: '='
    },
    link: function ($scope) {
      $scope.actions = {
        removeItem: function (event, item) {
          $scope.openItems.remove(item);

          //We need to stop propagation, so we need to manually trigger close-popovers
          $rootScope.$broadcast('close-popovers');
          event.stopPropagation();
        },
        addBuildStream: function () {
          if (!$scope.openItems) {
            return;
          }
          $scope.popoverAddTab.data.show = false;
          return $scope.openItems.addBuildStream();
        },
        addTerminal: function () {
          if (!$scope.openItems) {
            return;
          }
          $scope.popoverAddTab.data.show = false;
          return $scope.openItems.addTerminal();
        },
        addLogs: function () {
          if (!$scope.openItems) {
            return;
          }
          $scope.popoverAddTab.data.show = false;
          return $scope.openItems.addLogs();
        }
      };
      $scope.data = {
        show: false,
        options: $scope.showAddButtons
      };
    }
  };
}
