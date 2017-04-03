'use strict';

require('app')
  .controller('BranchTestPopoverButtonController', BranchTestPopoverButtonController);
function BranchTestPopoverButtonController(
  $scope,
  getLatestCommitShaForInstance,
  keypather
) {
  var BTPBC = this;

  function initData () {
    BTPBC.popoverData = {
      instance: BTPBC.instance
    };

    getLatestCommitShaForInstance(BTPBC.instance).then(function (latestSha) {
      BTPBC.latestSha = latestSha;
      populateCurrentSha();
    });
  }

  function populateCurrentSha () {
    var testSha = keypather.get(BTPBC, 'instance.containerHistory.commitSha');
      if (BTPBC.latestSha && testSha !== BTPBC.latestSha) {
        BTPBC.sha = testSha;
      } else {
        BTPBC.sha = '';
      }
  }

  initData();
  BTPBC.instance.on('update', initData);
  $scope.$watch(function () {
    return BTPBC.instance.containerHistory;
  }, function () {
    populateCurrentSha();
  });
}
