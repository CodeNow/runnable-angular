'use strict';

require('app')
  .controller('BranchTestPopoverButtonController', BranchTestPopoverButtonController);
function BranchTestPopoverButtonController(
  $q,
  fetchCommitData,
  promisify,
  keypather
) {
  var BTPBC = this;

  function initData() {
    BTPBC.appCodeVersion = BTPBC.instance.contextVersion.getMainAppCodeVersion();
    BTPBC.branch = fetchCommitData.activeBranch(BTPBC.appCodeVersion);

    BTPBC.popoverData = {
      branch: BTPBC.branch,
      instance: BTPBC.instance
    };

    $q.when()
      .then(function () {
        if (BTPBC.branch.commits.models.length === 0) {
          return promisify(BTPBC.branch.commits, 'fetch')();
        }
        return;
      })
      .then(calculateSha());
  }

  function calculateSha() {
    var latestBranchCommitSha = keypather.get(BTPBC.branch, 'commits.models[0].attrs.sha');
    var currentSha = keypather.get(BTPBC.appCodeVersion, 'attrs.commit');

    if (latestBranchCommitSha && (currentSha !== latestBranchCommitSha)) {
      BTPBC.sha = currentSha;
    } else {
      BTPBC.sha = '';
    }
  }

  initData();
  BTPBC.instance.on('update', initData);
}
