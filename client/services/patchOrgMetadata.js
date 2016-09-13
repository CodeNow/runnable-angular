'use strict';

require('app')
  .factory('patchOrgMetadata', patchOrgMetadata);

function patchOrgMetadata(
  $http,
  configAPIHost
) {
  return function (orgId, params) {
    return $http({
      method: 'patch',
      url: configAPIHost + '/auth/whitelist/' + orgId,
      data: params
    })
      .then(function (data) {
        return data;  // Github returns 404 when the user isn't part of the org
      })
      .catch(function (err) {
        return err;
      });
  };
}