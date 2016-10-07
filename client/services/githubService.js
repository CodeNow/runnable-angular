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
          .then(function (respoonse) {
            if (respoonse.status > 300) {
              return $q.reject(respoonse.data);
            }
            return respoonse.data;
          });
      });
  }
  return {
    forkRepo: function (repoOwner, repoName, targetOrg) {
      return makeGhRequest({
        method: 'post',
        url: githubAPIUrl + '/repos/' + repoOwner + '/' + repoName + '/forks',
        data: {
          organization: targetOrg
        }
      });
    }
  };
}
