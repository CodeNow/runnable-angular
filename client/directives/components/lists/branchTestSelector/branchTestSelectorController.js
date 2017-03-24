'use strict';

require('app')
  .controller('BranchTestSelectorController', BranchTestSelectorController);

function BranchTestSelectorController(
  $scope,
  keypather
) {
  var BTSC = this;

  BTSC.onCommitFetch = function (commits) {
    if (!commits.models.length) { return; }
    if (BTSC.data.commit) {
      BTSC.data.commit = commits.models.find(function (otherCommits) {
          return otherCommits === BTSC.data.commit;
        }) || commits.models[0];
    }
  };

  BTSC.selectCommit = function (commit) {
    BTSC.data.commit = commit;
    $scope.$emit('test-commit::selected', commit);
  };

  BTSC.setToLatestCommit = function() {
    var firstCommit = keypather.get(BTSC.data.branch, 'commits.models[0]')
    BTSC.data.commit = firstCommit;
    BTSC.selectCommit(firstCommit);
  }
}
