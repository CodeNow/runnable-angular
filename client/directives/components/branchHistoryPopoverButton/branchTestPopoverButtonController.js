'use strict';

require('app')
  .controller('BranchTestPopoverButtonController', BranchTestPopoverButtonController);
function BranchTestPopoverButtonController(
  fetchCommitData,
  $state
) {
  var BTPBC = this;
  BTPBC.appCodeVersion = BTPBC.instance.contextVersion.getMainAppCodeVersion();
  BTPBC.branch = fetchCommitData.activeBranch(BTPBC.appCodeVersion);
  BTPBC.popoverData = {
    branch: BTPBC.branch,
    instance: BTPBC.instance
  };

  BTPBC.sha = $state.params.sha;
}
