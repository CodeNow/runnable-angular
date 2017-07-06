'use strict';

require('app')
  .controller('BranchCommitPopoverButtonController', BranchCommitPopoverButtonController);
function BranchCommitPopoverButtonController(
  keypather,
  getLatestCommitShaForInstance
) {
  var BCPBC = this;

  function initData() {
    BCPBC.appCodeVersion = keypather.get(BCPBC, 'instance.contextVersion.getMainAppCodeVersion()');

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
