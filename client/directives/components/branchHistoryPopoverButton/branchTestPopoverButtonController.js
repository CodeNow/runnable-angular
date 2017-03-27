'use strict';

require('app')
  .controller('BranchTestPopoverButtonController', BranchTestPopoverButtonController);
function BranchTestPopoverButtonController(
  fetchCommitData,
  $state
) {

  var BTPBC = this;
  BTPBC.branch = fetchCommitData.activeBranch(BTPBC.appCodeVersion);

  BTPBC.popoverData = {
    branch: BTPBC.branch,
    appCodeVersion: BTPBC.appCodeVersion,
    instance: BTPBC.instance
  }

  BTPBC.sha = $state.params.sha;
}
