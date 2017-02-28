'use strict';

require('app')
  .factory('github', github);

function github(
  $http,
  $q,
  fetchUser,
  keypather,
  configGithubUrl
) {
  var githubAPIUrl = configGithubUrl;
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
    branchOrPRCommits: function (acv) {
      var pullRequest = acv.attrs.pullRequest;
      var repo = acv.attrs.lowerRepo;
      var githubUrl;
      if (pullRequest) {
        githubUrl = '/repos/' + repo + '/pulls/' + pullRequest + '/commits?per_page=100';
      } else {
        githubUrl = '/repos/' + repo + '/commits?sha=' + acv.attrs.branch + '&per_page=100';
      }
      var ghRequest = {
        method: 'get',
        url: githubAPIUrl + githubUrl
      };
      return makeGhRequest(ghRequest);
    },
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

    makeGhRequest: makeGhRequest
  };
}
