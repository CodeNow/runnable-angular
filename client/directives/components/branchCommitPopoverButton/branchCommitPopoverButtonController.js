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

    getLatestCommitShaForInstance(BCPBC.instance).then(function (latestSha) {
      var currentSha = keypather.get(BCPBC.appCodeVersion, 'attrs.commit');

      if (latestSha && (currentSha !== latestSha)) {
        BCPBC.sha = currentSha;
      } else {
        BCPBC.sha = '';
      }
    });
  }

  initData();
  BCPBC.instance.on('update', initData);
  BCPBC.popoverData = {
    instance: BCPBC.instance
  };
}
