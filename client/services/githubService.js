'use strict';

require('app')
  .factory('github', github);

function github(
  $http,
  $q,
  fetchUser,
  keypather,
  configGithubUrl,
  configAPIHost,
  customWindowService
) {
  var githubAPIUrl = configGithubUrl;
  function makeRawGhRequest(options) {
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
              return $q.reject(response);
            }
            return response;
          });
      });
  }

  function makeGhRequest(options) {
    return makeRawGhRequest(options)
      .then(function (response) {
        return response.data;
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

    getRepoInfo: function (repoOwner, repoName) {
      var ghRequest = {
        method: 'get',
        url: githubAPIUrl + '/repos/' + repoOwner + '/' + repoName
      };
      return makeGhRequest(ghRequest);
    },

    getGhScopes: function() {
      return makeRawGhRequest({
        method: 'get',
        url:  githubAPIUrl + '/user'
      })
        .then(function(resp) {
          return (keypather.get(resp, 'headers().x-oauth-scopes') || '').split(', ');
        });
    },

    upgradeGhScope: function() {
      return customWindowService(configAPIHost + '/auth/github/upgrade', {
        width: 1020, // match github minimum width
        height: 660
      });
    },

    makeGhRequest: makeGhRequest
  };
}
