'use strict';

require('app')
  .controller('BranchCommitPopoverButtonController', BranchCommitPopoverButtonController);
function BranchCommitPopoverButtonController(
  fetchCommitData,
  keypather
) {

  var BCPBC = this;

  BCPBC.data = {
    instance: BCPBC.instance,
    appCodeVersion: BCPBC.appCodeVersion,
    branch: fetchCommitData.activeBranch(BCPBC.appCodeVersion)
  };

  var latestBranchCommitSha = keypather.get(BCPBC.data.branch, 'commits.models[0].attrs.sha');
  if (latestBranchCommitSha && (keypather.get(BCPBC.appCodeVersion, 'attrs.commit') !== latestBranchCommitSha)) {
    BCPBC.sha = latestBranchCommitSha.substring(0,6);
  } else {
    BCPBC.sha = '';
  }

}
