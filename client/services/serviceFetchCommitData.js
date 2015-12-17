'use strict';

require('app')
  .factory('fetchCommitData', fetchCommitData);

function fetchCommitData (
  $q,
  errs,
  promisify,
  keypather,
  fetchUser,
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
      // Do not return promise, since we want to update the author asynchronously
      $q.all({
        activeCommit: promisify(activeCommit, 'fetch')(),
        user: fetchUser()
      })
        .then(function (response) {
          var userName = keypather.get(response.activeCommit, 'attrs.author.login');
          return $q.all([
            fetchGitHubUser(userName),
            promisify(response.user, 'fetchUsers')({ githubUsername: userName })
          ])
          .then(function (response) {
            var githubUser = response[0];
            var runnableUser = response[1];
            var user = {
              id: githubUser.id,
              login: githubUser.login,
              avatar_url: githubUser.avatar_url,
              email: githubUser.email,
              isRunnableUser: false, // Boolean(runnableUser.models.length),
              showInviteForm: false,
              inviteSending: false,
              inviteSent: false
            };
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
