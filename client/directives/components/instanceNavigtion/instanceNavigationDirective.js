'use strict';

require('app').directive('instanceNavigation', instanceNavigation);

function instanceNavigation(
  $state
) {
  return {
    restrict: 'A',
    templateUrl: 'instanceNavigationView',
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