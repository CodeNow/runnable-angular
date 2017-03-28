'use strict';

require('app')
  .controller('BranchCommitPopoverButtonController', BranchCommitPopoverButtonController);
function BranchCommitPopoverButtonController(
  keypather
) {
  var BCPBC = this;
  BCPBC.appCodeVersion = BCPBC.instance.contextVersion.getMainAppCodeVersion();

  BCPBC.popoverData = {
    instance: BCPBC.instance
  };

  var latestBranchCommitSha = keypather.get(BCPBC.branch, 'commits.models[0].attrs.sha');
  if (latestBranchCommitSha && (keypather.get(BCPBC.appCodeVersion, 'attrs.commit') !== latestBranchCommitSha)) {
    BCPBC.sha = latestBranchCommitSha.substring(0,6);
  } else {
    BCPBC.sha = '';
  }
}
