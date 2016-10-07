'use strict';

require('app')
  .factory('github', github);

function github(fetchUser, $http) {
  var githubAPIUrl = 'https://api.github.com';
  function makeGhRequest(options) {
    return fetchUser()
      .then(function (user) {
        var ghToken = user.attrs.bigPoppaUser.accessToken;
        options.params = options.params || {};
        options.params.access_token = ghToken;
        options.withCredentials = false;
        options.headers = options.headers || {};
        options.headers['X-CSRF-TOKEN'] = undefined;
        return $http(options);
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
