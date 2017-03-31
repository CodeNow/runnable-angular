'use strict';

require('app')
  .controller('BranchCommitPopoverButtonController', BranchCommitPopoverButtonController);
function BranchCommitPopoverButtonController(
  fetchCommitData,
  keypather,
  getLatestCommitShaForInstance
) {
  var BCPBC = this;

  function initData() {
    BCPBC.appCodeVersion = BCPBC.instance.contextVersion.getMainAppCodeVersion();
    BCPBC.branch = fetchCommitData.activeBranch(BCPBC.appCodeVersion);

    getLatestCommitShaForInstance(BTPBC.instance).then(function (latestSha) {
      var currentSha = keypather.get(BTPBC.appCodeVersion, 'attrs.commit');

      if (latestSha && (currentSha !== latestSha)) {
        BTPBC.sha = currentSha;
      } else {
        BTPBC.sha = '';
      }
    });
  }

  initData();
  BCPBC.instance.on('update', initData);
  BCPBC.popoverData = {
    instance: BCPBC.instance
  };
}
