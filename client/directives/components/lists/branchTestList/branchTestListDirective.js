'use strict';

require('app')
  .directive('branchTestList', branchTestList);

/*
 * This directive requires the following values to be on data:
 *  branch,
 *  commit,
 *  latestCommit,
 */
function branchTestList(
  errs,
  promisify
) {
  return {
    restrict: 'A',
    templateUrl: 'branchTestListView',
    controller: 'BranchTestListController',
    controllerAs: 'BTLC',
    bindToController: true,
    scope: {
      appCodeVersion: '=',
      instance: '='
    }
  };
}
