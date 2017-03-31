'use strict';

require('app')
  .controller('TestInstanceViewController', TestInstanceViewController);
/**
 * controller TestInstanceViewController
 * @ngInject
 */
function TestInstanceViewController(
  $scope,
  $state,
  fetchCommitData,
  keypather,
  OpenItems,
  testInstance,
  updateInstanceWithNewAcvData
) {
  var TIVC = this;
  TIVC.testInstance = testInstance;
  TIVC.testInstance.shortCommit = TIVC.testInstance.containerHistory.commitSha.slice(0, 6);
  TIVC.openItems = new OpenItems();
  TIVC.openItems.removeAllButLogs();
  TIVC.openItems.models[1].attrs.name = 'Test Logs';

  var exitCodes = {
    0: 'stopped',
    1: 'crashed'
  };

  var branch = fetchCommitData.activeBranch(keypather.get(TIVC, 'testInstance.build.contextVersions.models[0].appCodeVersions.models[0]'));
  TIVC.testInstance.branch = branch;

  var statusFunc = testInstance.status;

  TIVC.testInstance.status = function () {
    return exitCodes[this.containerHistory.application.exitCode] || 'crashed';
  };

  $scope.$on('$destroy', function (event) {
    TIVC.testInstance.status = statusFunc;
    delete testInstance.containerHistory;
  });

  fetchCommitData.branchCommits(branch)
    .then(function(commits) {
      TIVC.testInstance.commitHistory = commits;
      if (TIVC.testInstance.containerHistory.commitSha !== keypather.get(commits, 'models[0].attrs.sha')) {
        TIVC.testInstance.showCommitHash = true;
      }
    });
}
