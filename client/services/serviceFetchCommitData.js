'use strict';

require('app')
  .factory('fetchCommitData', fetchCommitData);

function fetchCommitData (
  errs
) {

  return {
    activeBranch: function (acv) {
      // API client caches models by URL
      // $scope.activeBranch will === acv.githubRepo.branches.models[x]
      // after the fetch
      var activeBranch = acv.githubRepo.newBranch(acv.attrs.branch);
      acv.githubRepo.branches.add(activeBranch);
      acv.githubRepo.branches.fetch(errs.handler);
      return activeBranch;
    },

    activeCommit: function (acv) {
      var activeCommit = acv.githubRepo.newCommit(acv.attrs.commit);
      activeCommit.fetch(errs.handler);
      return activeCommit;
    },

    offset: function (acv, activeCommit, cb) {
      activeCommit.commitOffset(acv.attrs.branch, function (err, diff) {
        if (err) {
          // not a throw situation
          // 404 could mean the commit doesn't exist on that branch anymore (git reset)
          // view will display 'update to latest' message if commitsBehind falsy
          cb(null, false);
        } else {
          cb(null, diff.behind_by);
        }
      });
    },

    branchCommits: function (branch) {
      branch.commits.fetch(errs.handler);
    }
  };
}