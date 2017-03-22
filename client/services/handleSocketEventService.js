'use strict';

require('app')
  .factory('handleSocketEvent', handleSocketEvent);

function handleSocketEvent(
  $q,
  $rootScope
) {
  return function (event) {
    var deferred = $q.defer();
    var unregisterSocketEventHandler = $rootScope.$on(event, function (evt, data) {
      unregisterSocketEventHandler();
      if (data.data.err) {
        deferred.reject(data.data.err);
        return;
      }
      deferred.resolve(data.data);
    });
    return deferred.promise;
  };
}
