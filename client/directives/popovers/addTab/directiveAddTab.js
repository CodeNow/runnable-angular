'use strict';

require('app')
  .directive('addTab', addTab);
/**
 * @ngInject
 */
function addTab(
  helperAddTab
) {
  return {
    restrict: 'A',
    templateUrl: 'viewAddTab',
    scope: {
      openItems: '=',
      showAddButtons: '='
    },
    link: function ($scope, elem, attrs) {


      $scope.popoverAddTab = helperAddTab($scope.showAddButtons, $scope.openItems);

    }
  };
}
