'use strict';

require('app')
  .factory('isRunnabotPartOfOrg', isRunnabotPartOfOrg);

function isRunnabotPartOfOrg(
  $http,
  configAPIHost
) {
  return function (orgName) {
    return $http({
      method: 'get',
      url: configAPIHost + '/github/orgs/' + orgName + '/memberships/runnabot'
    })
      .then(function (data) {
        return data.status < 400;  // Github returns 404 when the user isn't part of the org
      })
      .catch(function () {
        return false;
      });
  };
}