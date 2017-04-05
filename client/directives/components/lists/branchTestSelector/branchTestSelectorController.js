'use strict';

require('app')
  .controller('BranchTestSelectorController', BranchTestSelectorController);

function BranchTestSelectorController(
  $scope,
  $rootScope,
  $state,
  keypather,
  loading,
  fetchCommitData,
  updateInstanceWithNewAcvData,
  calculateHistoricalTestResult
) {
  var BTSC = this;
  BTSC.appCodeVersion = BTSC.instance.contextVersion.getMainAppCodeVersion();
  BTSC.branch = fetchCommitData.activeBranch(BTSC.appCodeVersion);

  BTSC.hasCommitBeenUpdated = function () {
    var newCommitSha = keypather.get(BTSC, 'commit.attrs.sha');
    var oldCommitSha = keypather.get(BTSC, 'appCodeVersion.attrs.commit');
    return newCommitSha && newCommitSha !== oldCommitSha;
  };

  BTSC.updateInstance = function () {
    if (BTSC.hasCommitBeenUpdated()) {
      loading('main', true);
      return updateInstanceWithNewAcvData(BTSC.instance, BTSC.appCodeVersion, {
        branch: BTSC.branch,
        commit: BTSC.commit
      })
        .finally(function () {
          loading('main', false);
        });
    }
  };

  BTSC.selectCommit = function (commit) {
    BTSC.commit = commit;

    if (!calculateHistoricalTestResult.isPassed(BTSC.commit.test) &&
        !calculateHistoricalTestResult.isFailed(BTSC.commit.test) &&
        !calculateHistoricalTestResult.isUnknown(BTSC.commit.test)) {
      BTSC.updateInstance();
    }

    $scope.$emit('test-commit::selected', commit);
    $rootScope.$broadcast('close-popovers');
  };

  BTSC.setToLatestCommit = function() {
    var firstCommit = keypather.get(BTSC.branch, 'commits.models[0]');
    BTSC.commit = firstCommit;
    BTSC.selectCommit(firstCommit);
    $state.go('base.instances.instance-test-sha', {
      instanceName: BTSC.instance.attrs.name,
      sha: firstCommit.attrs.sha
    });
    return;
  };

  BTSC.isLatestCommit = function() {
    return BTSC.commit === keypather.get(BTSC.branch, 'commits.models[0]');
  };

  BTSC.hasTest = function(commit) {
    return commit.test === 'passed' || commit.test === 'failed';
  };
}
