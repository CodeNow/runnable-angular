'use strict';

require('app')
  .controller('BranchCommitPopoverButtonController', BranchCommitPopoverButtonController);
function BranchCommitPopoverButtonController(
  $scope,
  fetchCommitData,
  keypather,
  promisify
) {
  var BCPBC = this;
  BCPBC.popoverOpen = false;
  BCPBC.popOverOptions = {
    verticallyCentered:true,
    left:26,
    pinToViewPort: true
  };

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
      // TODO: Get element width instead
      BCPBC.popOverOptions.left = 74;
    } else {
      BCPBC.sha = '';
      BCPBC.popOverOptions.left = 26;
    }
  }

  var unPopoverClosed = $scope.$on('popover-closed', function () {
    BCPBC.popoverOpen = false;
  });

  initData();
  BCPBC.instance.on('update', initData);
  BCPBC.popoverData = {
    instance: BCPBC.instance
  };
  $scope.$on('$destroy', function () {
    unPopoverClosed();
  });
}
