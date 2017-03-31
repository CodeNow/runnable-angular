'use strict';

require('app')
  .directive('branchCommitList', branchCommitList);

/*
 * This directive requires the following values to be on data:
 *  branch,
 *  commit,
 *  latestCommit,
 */
function branchCommitList(
  errs,
  promisify
) {
  return {
    restrict: 'A',
    templateUrl: 'branchCommitListView',
    controller: 'BranchCommitListController',
    controllerAs: 'BCLC',
    bindToController: true,
    scope: {
      appCodeVersion: '=',
      instance: '='
    }
  };
}
