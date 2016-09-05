'use strict';

require('app')
  .factory('addRunnabotToGithubOrg', addRunnabotToGithubOrg)
  .factory('isRunnabotPartOfOrg', isRunnabotPartOfOrg);

function isRunnabotPartOfOrg(
  $http,
  configAPIHost,
  memoize
) {
  return memoize(function (orgName) {
    return $http({
      method: 'get',
      url: configAPIHost + '/github/orgs/' + orgName + '/members/runnabot'
    })
      .then(function (data) {
        return data.status !== 404;  // Github returns 404 when the user isn't part of the org
      })
      .catch(function () {
        return false;
      });
  });
}

function addRunnabotToGithubOrg(
  $http,
  configAPIHost
) {
  return function (orgName) {
    return $http({
      method: 'put',
      url: configAPIHost + '/github/orgs/' + orgName + '/memberships/runnabot',
      params: {
        role: 'member'
      }
    });
  };
}