'use strict';

require('app')
  .controller('BranchCommitPopoverButtonController', BranchCommitPopoverButtonController);
function BranchCommitPopoverButtonController(
  $q,
  fetchCommitData,
  keypather,
  promisify
) {
  var BCPBC = this;

  function initData() {
    BCPBC.appCodeVersion = BCPBC.instance.contextVersion.getMainAppCodeVersion();
    BCPBC.branch = fetchCommitData.activeBranch(BCPBC.appCodeVersion);

    $q.when()
      .then(function () {
        if (BCPBC.branch.commits.models.length === 0) {
          return promisify(BCPBC.branch.commits, 'fetch')();
        }
        return;
      })
      .then(calculateSha());
  }

  function calculateSha() {
    var latestBranchCommitSha = keypather.get(BCPBC.branch, 'commits.models[0].attrs.sha');
    var currentSha = keypather.get(BCPBC.appCodeVersion, 'attrs.commit');

    if (latestBranchCommitSha && (currentSha !== latestBranchCommitSha)) {
      BCPBC.sha = currentSha;
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
