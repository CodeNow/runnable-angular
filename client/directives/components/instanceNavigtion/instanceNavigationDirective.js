'use strict';

require('app').directive('instanceNavigation', instanceNavigation);

function instanceNavigation(
) {
  return {
    restrict: 'E',
    templateUrl: 'instanceNavigationView',
    controller: 'InstanceNavigationController',
    controllerAs: 'INC',
    bindToController: true,
    replace: true,
    scope: {
      instance: '=',
      activeAccount: '=',
      masterInstance: '=?'
    }
  };
}