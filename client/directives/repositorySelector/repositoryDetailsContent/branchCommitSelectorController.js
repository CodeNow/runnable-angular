'use strict';

require('app')
  .controller('BranchCommitSelectorController', BranchCommitSelectorController);


/*
 * This directive requires the following actions in the parent scopoe:
 *   create, remove, update
 * Those actions must return a promise that gets resolved when the action is finished.
 *
 * There also needs to be a data attribute containing at minimum:
 */
function BranchCommitSelectorController(
  $scope,
  keypather
) {
  var BCSC = this;

  this.onCommitFetch = function (commits) {
    if (!commits.models.length) { return; }
    if (BCSC.data.commit) {
      BCSC.data.commit = commits.models.find(function (otherCommits) {
        return otherCommits === BCSC.data.commit;
      });
    }
    if (!BCSC.data.commit) {
      BCSC.data.commit = commits.models[0];
    }
  };
  this.isLatestCommit = function (setToLatestCommit) {
    if (arguments.length) {
      BCSC.data.commit = keypather.get(BCSC.data.branch, 'commits.models[0]');
      BCSC.data.latestCommit = setToLatestCommit;
    } else {
      return BCSC.data.latestCommit;
    }
  };

  this.selectCommit = function (commit) {
    BCSC.data.latestCommit = false;
    BCSC.data.commit = commit;
    $scope.$emit('commit::selected', commit);
  };
}
