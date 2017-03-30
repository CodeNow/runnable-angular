'use strict';

require('app')
  .controller('BranchTestSelectorController', BranchTestSelectorController);

function BranchTestSelectorController(
  $scope,
  $rootScope,
  $state,
  keypather
) {
  var BTSC = this;

  BTSC.selectCommit = function (commit) {
    BTSC.commit = commit;
    $scope.$emit('test-commit::selected', commit);
    $rootScope.$broadcast('close-popovers');
  };

  BTSC.setToLatestCommit = function() {
    var firstCommit = keypather.get(BTSC.branch, 'commits.models[0]');
    BTSC.commit = firstCommit;
    BTSC.selectCommit(firstCommit);
    $state.go('base.instances.instance-test-sha', {instanceName: BTSC.instanceName, sha: firstCommit.attrs.sha});
  };

  BTSC.isLatestCommit = function() {
    return BTSC.commit === keypather.get(BTSC.branch, 'commits.models[0]');
  };

  BTSC.hasTest = function(commit) {
    return commit.test === 'passed' || commit.test === 'failed';
  };
}
