'use strict';

require('app')
  .controller('BranchTestPopoverButtonController', BranchTestPopoverButtonController);
function BranchTestPopoverButtonController(
  $scope,
  fetchCommitData,
  promisify,
  keypather
) {
  var BTPBC = this;
  BTPBC.popoverOpen = false;

  function initData() {
    BTPBC.appCodeVersion = BTPBC.instance.contextVersion.getMainAppCodeVersion();
    BTPBC.branch = fetchCommitData.activeBranch(BTPBC.appCodeVersion);

    BTPBC.popoverData = {
      branch: BTPBC.branch,
      instance: BTPBC.instance
    };

    if (BTPBC.branch.commits.models.length === 0) {
      promisify(BTPBC.branch.commits, 'fetch')().then(calculateSha);
    } else {
      calculateSha();
    }
  }

  function calculateSha() {
    var latestBranchCommitSha = keypather.get(BTPBC.branch, 'commits.models[0].attrs.sha');
    if (keypather.get(BTPBC.appCodeVersion, 'attrs.commit') !== latestBranchCommitSha) {
      BTPBC.sha = latestBranchCommitSha.substring(0,7);
    } else {
      BTPBC.sha = '';
    }
  }

  var unPopoverClosed = $scope.$on('popover-closed', function () {
    BTPBC.popoverOpen = false;
  });

  initData();
  BTPBC.instance.on('update', initData);
  $scope.$on('$destroy', function () {
    unPopoverClosed();
  });
}
