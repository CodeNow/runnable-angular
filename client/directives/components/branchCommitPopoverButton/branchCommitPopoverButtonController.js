'use strict';

require('app')
  .controller('BranchCommitPopoverButtonController', BranchCommitPopoverButtonController);
function BranchCommitPopoverButtonController(
  fetchCommitData,
  keypather,
  promisify
) {
  var BCPBC = this;

  function initData() {
    BCPBC.appCodeVersion = BCPBC.instance.contextVersion.getMainAppCodeVersion();
    BCPBC.branch = fetchCommitData.activeBranch(BCPBC.appCodeVersion);
    if (BCPBC.branch.commits.models.length === 0) {
      promisify(BCPBC.branch.commits, 'fetch')().then(calculateSha);
    } else {
      calculateSha();
    }
  }

  function calculateSha() {
    var latestBranchCommitSha = keypather.get(BCPBC.branch, 'commits.models[0].attrs.sha');
    if (keypather.get(BCPBC.appCodeVersion, 'attrs.commit') !== latestBranchCommitSha) {
      BCPBC.sha = latestBranchCommitSha.substring(0,7);
    } else {
      BCPBC.sha = '';
    }
  }

  initData();
  BCPBC.instance.on('update', initData);
  BCPBC.popoverData = {
    instance: BCPBC.instance
  };
}
