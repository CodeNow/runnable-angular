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
    controller: 'DemoAddBranchController as DBC',
    link: function (scope, elem, attrs) {
      console.log(scope, elem, attrs);
    }
  };
}
