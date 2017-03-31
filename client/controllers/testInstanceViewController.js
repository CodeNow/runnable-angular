'use strict';

require('app')
  .controller('TestInstanceViewController', TestInstanceViewController);
/**
 * controller TestInstanceViewController
 * @ngInject
 */
function TestInstanceViewController(
  $scope,
  fetchCommitData,
  keypather,
  OpenItems,
  testInstance
) {
  var TIVC = this;
  TIVC.testInstance = testInstance;
  TIVC.testInstance.shortCommit = TIVC.testInstance.containerHistory.commitSha.slice(0, 6);
  TIVC.openItems = new OpenItems();
  TIVC.openItems.removeAllButLogs();
  TIVC.openItems.models[1].attrs.name = 'Test Logs';

  var exitCodes = {
    0: 'Tests Passed',
    1: 'Tests Failed'
  };

  TIVC.testInstance.containerHistory.application.status = exitCodes[TIVC.testInstance.containerHistory.application.exitCode] || 'crashed';

  var branch = fetchCommitData.activeBranch(keypather.get(TIVC, 'testInstance.build.contextVersions.models[0].appCodeVersions.models[0]'));
  TIVC.testInstance.branch = branch;

  fetchCommitData.branchCommits(branch)
    .then(function(commits) {
      TIVC.testInstance.commitHistory = commits;
      if (TIVC.testInstance.containerHistory.commitSha !== keypather.get(commits, 'models[0].attrs.sha')) {
        TIVC.testInstance.showCommitHash = true;
      }
    });
}
