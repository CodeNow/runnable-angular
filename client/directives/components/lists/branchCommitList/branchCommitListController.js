'use strict';

require('app')
  .controller('BranchCommitListController', BranchCommitListController);
/**
 * controller BranchCommitListController
 * @ngInject
 */
function BranchCommitListController(
  $q,
  $scope,
  fetchCommitData,
  keypather,
  loading,
  promisify,
  updateInstanceWithNewAcvData
) {
  var BCLC = this;

  BCLC.data = {
    repo: BCLC.appCodeVersion.githubRepo,
    acv: BCLC.appCodeVersion,
    branch: fetchCommitData.activeBranch(BCLC.appCodeVersion),
    useLatest: BCLC.appCodeVersion.attrs.useLatest,
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

  BCLC.hasLockedBeenUpdated = function () {
    return BCLC.data.locked !== BCLC.instance.attrs.locked;
  };

  BCLC.updateInstance = function () {
    return $q.when()
      .then(function () {
        loading('main', true);
        if (!BCLC.hasLockedBeenUpdated()) {
          return;
        }
        return promisify(BCLC.instance, 'update')({
          locked: BCLC.data.locked
        });
      })
      .then(function () {
        if (BCLC.hasCommitBeenUpdated()) {
          return updateInstanceWithNewAcvData(BCLC.instance, BCLC.appCodeVersion, BCLC.data);
        }
      })
      .finally(function () {
        loading('main', false);
      });
  };
}
