'use strict';

require('app')
  .factory('handleMultiClusterCreateResponse', handleMultiClusterCreateResponse);

function handleMultiClusterCreateResponse(
  $q,
  handleSocketEvent,
  keypather
) {
  return function (response) {
    var results = keypather.get(response, 'data.created');
    if (!results) {
      return $q.when();
    }
    var externals = results.externals;
    var builds = results.builds;
    var allHashes = [].concat(externals, builds).map(function (clusterResults) {
      return clusterResults.hash;
    });
    return $q.all(allHashes.map(function () {
      return handleSocketEvent('compose-cluster-created');
    }))
      .then(function (socketResponse) {
        var clustersCreated = socketResponse.map(function (response) {
          return response.clusterName;
        });
        var leftovers = allHashes.filter(function (hash) {
          return !clustersCreated.includes(hash);
        });
        if (leftovers.length) {
          return $q.reject(new Error('Not all of the requested repositories could be created.'));
        }
      });

  };
}
