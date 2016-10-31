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
    isPersonalRunnabot: function (githubUsername, repoName) {
      var req = {
        method: 'get',
        url:  'https://api.github.com/repos/' + githubUsername + '/' + repoName + '/collaborators/runnabot'
      };
      return makeGhRequest(req)
        .then(function (response) {
          // if runnabot is already a contributor there is no response body
          return {
            isRunnabotPersonalCollaborator: true
          };
        })
        .catch(function (err) {
          if (err.message === 'Not Found') {
            return {
              githubUsername: githubUsername,
              isRunnabotPersonalCollaborator: false,
              repoName: repoName
            };
          }
        });
    },
    inviteRunnabotAsCollaborator: function (githubUsername, repoName) {
      var req = {
        method: 'put',
        url:  'https://api.github.com/repos/' + githubUsername + '/' + repoName + '/collaborators/runnabot'
      };
      return makeGhRequest(req);
    },
    removeRunnabotAsCollaborator: function (githubUsername, repoName) {
      var req = {
        method: 'delete',
        url:  'https://api.github.com/repos/' + githubUsername + '/' + repoName + '/collaborators/runnabot'
      };
      return makeGhRequest(req);
    }
  };
}
