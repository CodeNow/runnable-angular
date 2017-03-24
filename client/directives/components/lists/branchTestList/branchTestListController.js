'use strict';

require('app')
  .controller('BranchTestListController', BranchTestListController);
/**
 * controller BranchTestListController
 * @ngInject
 */
function BranchTestListController(
  $scope,
  $state,
  fetchCommitData,
  keypather,
  fetchInstanceTestHistory
) {
  var BTLC = this;
  const TEST_STATES = {
    PASSED: 1,
    FAILED: 2,
    UNKNOWN: 3
  }

  BTLC.data = {
    repo: BTLC.appCodeVersion.githubRepo,
    acv: BTLC.appCodeVersion,
    branch: fetchCommitData.activeBranch(BTLC.appCodeVersion),
    useLatest: BTLC.appCodeVersion.attrs.useLatest,
    locked: BTLC.instance.attrs.locked,
    instance: BTLC.instance
  };

  fetchInstanceTestHistory(BTLC.instance.attrs.id)
    .then(function(tests) {
      for (var com of BTLC.data.branch.commits.models) {
        var index = tests.findIndex((test) => {
          return com.attrs.sha === test.commitSha;
        });

        if (index >= 0) {
          addTestResults(tests[index], com);
          tests.splice(index, 1);
        }

        if (BTLC.appCodeVersion.attrs.commit === com.attrs.sha) {
          BTLC.data.commit = com;
        }
      }

      return;
    });

  $scope.$on('test-commit::selected', function (evt, commit) {
    if (isLatestCommit(commit)) {
      $state.go('base.instances.instance-test', {instanceName: $state.params.instanceName});
    } else {
      $state.go('base.instances.instance-test-sha', {instanceName: $state.params.instanceName, sha: commit.attrs.sha});
    }
  });

  function addTestResults(test, com) {
    if (test.build.stop !== new Date(0) && !test.build.failed) {
      if (test.application.exitCode > 0) {
        com.attrs.test = TEST_STATES.FAILED;
      } else if (test.application.exitCode === 0 && test.application.stop !== new Date(0)) {
        com.attrs.test = TEST_STATES.PASSED;
      }
    }

    if (!com.attrs.test) {
      com.attrs.test = TEST_STATES.UNKNOWN;
    }
  }

  function isLatestCommit(commit) {
    return keypather.get(commit, 'attrs.sha') === keypather.get(getLatestCommit(), 'attrs.sha');
  }

  function getLatestCommit() {
    return keypather.get(BTLC.data.branch, 'commits.models[0]');
  }
}
