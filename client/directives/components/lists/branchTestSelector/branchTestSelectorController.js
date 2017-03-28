'use strict';

require('app')
  .controller('BranchTestSelectorController', BranchTestSelectorController);

function BranchTestSelectorController(
  $scope,
  $state,
  keypather
) {
  var BTSC = this;

  BTSC.onCommitFetch = function (commits) {
    if (!commits.models.length) { return; }
    if (BTSC.commit) {
      BTSC.commit = commits.models.find(function (otherCommits) {
          return otherCommits === BTSC.commit;
        }) || commits.models[0];
    }
  };

  BTSC.selectCommit = function (commit) {
    BTSC.commit = commit;
    $scope.$emit('test-commit::selected', commit);
  };

  BTSC.setToLatestCommit = function() {
    var firstCommit = keypather.get(BTSC.branch, 'commits.models[0]');
    BTSC.commit = firstCommit;
    BTSC.selectCommit(firstCommit);
    $state.go('base.instances.instance-test-sha', {instanceName: BTSC.instanceName, sha: firstCommit.attrs.sha});
  };

  BTSC.isLatestCommit = function() {
    return BTSC.commit === keypather.get(BTSC.branch, 'commits.models[0]');
  }
}
