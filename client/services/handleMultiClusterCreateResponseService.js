'use strict';

require('app')
  .factory('handleMultiClusterCreateResponse', handleMultiClusterCreateResponse)
  .factory('handleMultiSocketEvent', handleMultiSocketEvent);

function handleMultiClusterCreateResponse(
  $q,
  handleMultiSocketEvent,
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
      return handleMultiSocketEvent('compose-cluster-created', 'data.clusterName', allHashes);
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

function handleMultiSocketEvent(
  $q,
  $rootScope,
  keypather
) {
  return function (event, pathToValueToCheck, valuesToFind) {
    var deferred = $q.defer();
    var unregisterSocketEventHandler = $rootScope.$on(event, function (evt, data) {
      var valueToCheck = keypather.get(data, pathToValueToCheck);
      if (valuesToFind.includes(valueToCheck)) {
        unregisterSocketEventHandler();
        if (data.data.err) {
          deferred.reject(data.data.err);
          return;
        }
        deferred.resolve(data.data);
      }
    });
    return deferred.promise;
  };
}
