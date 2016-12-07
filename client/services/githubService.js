'use strict';

require('app')
  .factory('github', github);

function github(
  $http,
  $q,
  fetchUser,
  keypather
) {
  var githubAPIUrl = 'https://api.github.com';
  function makeGhRequest(options) {
    return fetchUser()
      .then(function (user) {
        var ghToken = keypather.get(user, 'attrs.bigPoppaUser.accessToken');
        if (!ghToken) {
          return $q.reject('Unable to get your access token to github. Please reload the page.');
        }
        options.params = options.params || {};
        options.params.access_token = ghToken;
        options.withCredentials = false;
        options.headers = options.headers || {};
        options.headers['X-CSRF-TOKEN'] = undefined;
        return $http(options)
          .then(function (response) {
            if (response.status > 300) {
              return $q.reject(response.data);
            }
            return response.data;
          });
      });
  }
  return {
    forkRepo: function (repoOwner, repoName, targetOrg, isPersonalAccount) {
      var ghRequest = {
        method: 'post',
        url: githubAPIUrl + '/repos/' + repoOwner + '/' + repoName + '/forks',
      };
      if (!isPersonalAccount) {
        ghRequest.data = {
          organization: targetOrg
        };
      }
      return makeGhRequest(ghRequest);
    },
    createNewBranch: function (repoOwner, repoName, commitToBranchFrom, newBranchName) {
      var ghRequest = {
        method: 'post',
        url: githubAPIUrl + '/repos/' + repoOwner + '/' + repoName + '/git/refs',
        data: {
          ref: 'refs/heads/' + newBranchName,
          sha: commitToBranchFrom
        }
      };
      return makeGhRequest(ghRequest);
    },

    createCommit: function (repoOwner, repoName, commitSha, treeSha) {
      var ghRequest = {
        method: 'post',
        url: githubAPIUrl + '/repos/' + repoOwner + '/' + repoName + '/git/commits',
        data: {
          message: 'This commit was made by Runnable!',
          tree: treeSha,
          parents: [commitSha]
        }
      };
      return makeGhRequest(ghRequest);
    },

    updateRef: function (repoOwner, repoName, branchName, commitSha) {
      var ghRequest = {
        method: 'patch',
        url: githubAPIUrl + '/repos/' + repoOwner + '/' + repoName + '/git/refs/heads/' + branchName,
        data: {
          sha: commitSha
        }
      };
      return makeGhRequest(ghRequest);
    },

    createNewTreeFromSha: function (repoOwner, repoName, sha) {
      var ghRequest = {
        method: 'post',
        url: githubAPIUrl + '/repos/' + repoOwner + '/' + repoName + '/git/trees',
        data: {
          base_tree: sha,
          tree: [{
            path: 'test-file.txt',
            mode: '100644',
            type: 'blob',
            content: 'File created by runnable!'
          }]
        }
      };
      return makeGhRequest(ghRequest);
    },

    getTreeForCommit: function (repoOwner, repoName, sha) {
      var ghRequest = {
        method: 'get',
        url: githubAPIUrl + '/repos/' + repoOwner + '/' + repoName + '/git/commits/' + sha
      };
      return makeGhRequest(ghRequest);
    },

    createPR: function (repoOwner, repoName, branchToMergeTo, branchToMergeFrom) {
      var ghRequest = {
        method: 'post',
        url: githubAPIUrl + '/repos/' + repoOwner + '/' + repoName + '/pulls',
        data: {
          title: 'Runnable PR',
          body: 'This PR was created with Runnable',
          head: branchToMergeFrom,
          base: branchToMergeTo
        }
      };
      return makeGhRequest(ghRequest);
    },

    makeGhRequest: makeGhRequest
  };
}
