'use strict';

require('app')
  .factory('patchOrgMetadata', patchOrgMetadata);

function patchOrgMetadata(
  $http,
  configAPIHost,
  errs
) {
  return function (orgId, params) {
    return $http({
      method: 'patch',
      url: configAPIHost + '/auth/whitelist/' + orgId,
      data: params
    })
    .then(function(response) {
      return response.data;
    })
    .catch(errs.handler);
  };
}
