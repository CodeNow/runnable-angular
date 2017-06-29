'use strict';

require('app')
  .factory('handleMultiClusterCreateEvent', handleMultiClusterCreateEvent);

function handleMultiClusterCreateEvent(
  $q,
  handleSocketEvent,
  keypather
) {
  return function (response) {
    var results = keypather.get(response, 'data.created');
    if (!results) {
      return;
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
        socketResponse.filter(function (response) {
          return allHashes.contains(response.clusterName);
        });
      });

  };
}
