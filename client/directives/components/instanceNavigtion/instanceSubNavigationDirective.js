'use strict';

require('app').directive('instanceSubNavigation', instanceSubNavigation);

function instanceSubNavigation(
  $state
) {
  return {
    restrict: 'A',
    templateUrl: 'instanceSubNavigationView',
    controller: 'InstanceNavigationController',
    controllerAs: 'INC',
    bindToController: true,
    scope: {
      instance: '=',
      activeAccount: '=',
      masterInstance: '=?'
    },
    link: function ($scope) {
      $scope.$state = $state;
    }
  };
}
