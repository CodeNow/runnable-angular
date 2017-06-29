'use strict';

require('app')
  .factory('deleteMultiCluster', deleteMultiCluster);


function handleHTTPResponse(keypather, defaultValue) {
  return function (res) {
    if (res.status >= 300) {
      throw new Error(keypather.get(res, 'data.error'));
    }
    return res.data || defaultValue;
  };
}

function deleteMultiCluster (
  $http,
  configAPIHost,
  errs,
  keypather
) {
  return function (autoIsolationConfigId) {
    return $http({
      method: 'delete',
      url: configAPIHost + '/docker-compose-cluster/' + autoIsolationConfigId + '/multi'
    })
      .then(handleHTTPResponse(keypather))
      .catch(errs.handler);
  };
}
