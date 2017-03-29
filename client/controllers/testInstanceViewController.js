'use strict';

require('app')
  .controller('TestInstanceViewController', TestInstanceViewController);
/**
 * controller TestInstanceViewController
 * @ngInject
 */
function TestInstanceViewController(
  testInstanceData,
  fetchCommitData,
  keypather,
  OpenItems,
  updateInstanceWithNewAcvData
) {
  var TIVC = this;
  TIVC.testInstanceData = testInstanceData;
  keypather.set(TIVC, 'testInstanceData.containers.models[0].attrs.dockerContainer', TIVC.testInstanceData.containerHistory.application.containerId);
  keypather.set(TIVC, 'testInstanceData.build.contextVersions.models[0].attrs.build.dockerContainer', TIVC.testInstanceData.containerHistory.build.containerId);
  TIVC.openItems = new OpenItems();
  TIVC.openItems.removeAllButLogs();
  TIVC.openItems.models[1].attrs.name = 'Test Logs';

  var branch = fetchCommitData.activeBranch(keypather.get(TIVC, 'testInstanceData.build.contextVersions.models[0].appCodeVersions.models[0]'));

  TIVC.deployOldTestCommit = function () {
    var acv = TIVC.testInstanceData.contextVersion.appCodeVersions.models;
    return updateInstanceWithNewAcvData(TIVC.testInstanceData, acv, {
      branch: branch,
      commit: {
        attrs: {
          sha: TIVC.testInstanceData.containerHistory.commitSha
        }
      }
    });
  };

  fetchCommitData.branchCommits(branch)
    .then(function(commits) {
      TIVC.testInstanceData.commitHistory = commits;
      if (TIVC.testInstanceData.containerHistory.commitSha !== keypather.get(commits, 'models[0].attrs.sha')) {
        TIVC.testInstanceData.showCommitHash = true;
      }
    });

}
