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
      .then(function (data) {
        return data;
      })
      .catch(function (err) {
        errs.handler(err);
      });
  };
}