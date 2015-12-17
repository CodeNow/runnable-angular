'use strict';

require('app')
  .factory('fetchCommitData', fetchCommitData);

function fetchCommitData (
  errs,
  promisify,
  keypather,
  fetchGitHubUser
) {
  return {
    activeBranch: function (acv, branch) {
      // API client caches models by URL
      // $scope.activeBranch will === acv.githubRepo.branches.models[x]
      // after the fetch
      var activeBranch = acv.githubRepo.newBranch(branch || acv.attrs.branch, {warn: false});
      return activeBranch;
    },

    activeCommit: function (acv, commitHash) {
      var activeCommit = acv.githubRepo.newCommit(commitHash || acv.attrs.commit);
      promisify(activeCommit, 'fetch')()
        .then(function (acitveCommit) {
          var userName = keypather.get(activeCommit, 'attrs.author.login');
          return fetchGitHubUser(userName)
            .then(function (user) {
              keypather.set(activeCommit, 'attrs.author', user);
              return activeCommit;
            });
        })
        .catch(errs.handler);
      return activeCommit;
    },

    offset: function (acv, activeCommit) {
      return promisify(activeCommit, 'commitOffset')(acv.attrs.branch)
        .then(function (diff) {
          return diff.behind_by;
        });
    },

    branchCommits: function (branch) {
      branch.commits.fetch(angular.noop);
    }
  };
}
