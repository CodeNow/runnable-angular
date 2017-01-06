'use strict';

require('app')
  .directive('testingParentSelector', testingParentSelectorDirective);

function testingParentSelectorDirective() {
  return {
    restrict: 'A',
    templateUrl: 'testingParentSelector',
    controller: 'TestingParentSelectorController',
    controllerAs: 'TPSC',
    bindToController: true,
    scope: {
      instance: '=',
      state: '='
    }
  };
}


