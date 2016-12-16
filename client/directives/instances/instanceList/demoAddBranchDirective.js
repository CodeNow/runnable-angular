 'use strict';

require('app')
  .directive('demoAddBranch', demoAddBranch);
/**
 * @ngInject
 */
function demoAddBranch() {
  return {
    restrict: 'A',
    templateUrl: 'demoAddBranchView',
    scope: {
      userName: '=',
      instance: '='
    },
    controller: 'DemoAddBranchController',
    controllerAs: 'DBC',
    bindToController: true
  };
}
