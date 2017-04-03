'use strict';

require('app')
  .directive('branchTestSelector', branchTestSelector);

function branchTestSelector(
  errs,
  promisify
) {
  return {
    restrict: 'A',
    templateUrl: 'branchTestSelectorView',
    controller: 'BranchTestSelectorController',
    controllerAs: 'BTSC',
    bindToController: true,
    scope: {
      branch: '=',
      commit: '=',
      instance: '=',
      hideBranchSelector: '='
    }
  };
}
