'use strict';

require('app')
  .controller('BranchTestPopoverButtonController', BranchTestPopoverButtonController);
function BranchTestPopoverButtonController(
  getLatestCommitShaForInstance,
  keypather
) {
  var BTPBC = this;
  BTPBC.appCodeVersion = BTPBC.instance.contextVersion.getMainAppCodeVersion();

  function initData() {
    BTPBC.popoverData = {
      instance: BTPBC.instance
    };

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
  BTPBC.instance.on('update', initData);
}
