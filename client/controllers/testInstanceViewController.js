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
  keypather.set(TIVC, 'testInstance.containers.models[0].attrs.dockerContainer', TIVC.testInstance.containerHistory.application.containerId);
  keypather.set(TIVC, 'testInstance.build.contextVersions.models[0].attrs.build.dockerContainer', TIVC.testInstance.containerHistory.build.containerId);
  TIVC.openItems = new OpenItems();
  TIVC.openItems.removeAllButLogs();
  TIVC.openItems.models[1].attrs.name = 'Test Logs';

  var exitCodes = {
    0: 'stopped',
    1: 'crashed'
  }

  var branch = fetchCommitData.activeBranch(keypather.get(TIVC, 'testInstance.build.contextVersions.models[0].appCodeVersions.models[0]'));
  TIVC.testInstance.branch = branch;
  TIVC.testInstance.status = function () {
    return exitCodes[this.containerHistory.application.exitCode] || 'crashed';
  }

  fetchCommitData.branchCommits(branch)
    .then(function(commits) {
      TIVC.testInstance.commitHistory = commits;
      if (TIVC.testInstance.containerHistory.commitSha !== keypather.get(commits, 'models[0].attrs.sha')) {
        TIVC.testInstance.showCommitHash = true;
      }
    });

    $scope.$on('instance::updated', function () {
      return $state.go('base.instances.instance', {
        instanceName: $state.params.instanceName,
        userName: $state.params.userName
      });
    })
}
