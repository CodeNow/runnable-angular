'use strict';

require('app')
  .directive('branchCommitPopoverButton', branchCommitPopoverButton);

/*
 * This directive requires the following values to be on data:
 *  branch,
 *  commit,
 *  latestCommit,
 */
function branchCommitPopoverButton(
  errs,
  promisify
) {
  return {
    restrict: 'A',
    templateUrl: 'branchCommitPopoverButtonView',
    controller: 'BranchCommitPopoverButtonController',
    controllerAs: 'BCPBC',
    bindToController: true,
    scope: {
      instance: '='
    }
  };
}
