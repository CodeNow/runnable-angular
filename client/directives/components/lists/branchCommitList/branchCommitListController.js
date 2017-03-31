'use strict';

require('app')
  .controller('BranchCommitListController', BranchCommitListController);
function BranchCommitListController(
  $scope,
  fetchCommitData,
  keypather,
  loading,
  promisify,
  updateInstanceWithNewAcvData
) {
  var BCLC = this;
  BCLC.appCodeVersion = BCLC.instance.contextVersion.getMainAppCodeVersion();

  BCLC.data = {
    repo: BCLC.appCodeVersion.githubRepo,
    acv: BCLC.appCodeVersion,
    branch: fetchCommitData.activeBranch(BCLC.appCodeVersion),
    useLatest: BCLC.appCodeVersion.attrs.useLatest,
    // locked to that commit
    locked: BCLC.instance.attrs.locked,
    instance: BCLC.instance
  };
  fetchCommitData.activeCommit(BCLC.appCodeVersion)
    .then(function (commit) {
      BCLC.data.commit = commit;
    });

  $scope.$on('commit::selected', function (evt, commit) {
    BCLC.updateInstance();
  });

  BCLC.hasCommitBeenUpdated = function () {
    var newCommitSha = keypather.get(BCLC, 'data.commit.attrs.sha');
    var oldCommitSha = keypather.get(BCLC, 'appCodeVersion.attrs.commit');
    return newCommitSha && newCommitSha !== oldCommitSha;
  };

  BCLC.updateInstance = function () {
    if (BCLC.hasCommitBeenUpdated()) {
      loading('main', true);
      return updateInstanceWithNewAcvData(BCLC.instance, BCLC.appCodeVersion, BCLC.data)
        .finally(function () {
          loading('main', false);
        });
    }
  };

  BCLC.onLockUpdate = function() {
    return promisify(BCLC.instance, 'update')({
      locked: BCLC.data.locked
    });
  };
}
