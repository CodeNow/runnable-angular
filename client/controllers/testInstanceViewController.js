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
  keypather
) {
  var TIVC = this;
  TIVC.testInstanceData = testInstanceData;

  var branch = fetchCommitData.activeBranch(keypather.get(TIVC, 'testInstanceData.build.contextVersions.models[0].appCodeVersions.models[0]'));

  fetchCommitData.branchCommits(branch)
    .then(function(commits) {
      TIVC.testInstanceData.commitHistory = commits;
      if (TIVC.testInstanceData.containerHistory.commitSha !== keypather.get(commits, 'models[0].attrs.sha')) {
        TIVC.testInstanceData.showCommitHash = true;
      }
    });

}

