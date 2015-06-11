'use strict';

require('app')
  .factory('loadingPromises', loadingPromises);

function loadingPromises(
  $log,
  $q
) {
  var promiseHash = {};

  function add(namespace, promise) {
    if (!namespace) {
      $log.warn('loadingPromises should have a namespace, so just returning the promise')
      return promise;
    }
    if (!promiseHash[namespace]) {
      promiseHash[namespace] = [];
    }
    promiseHash[namespace].push(promise);
    return promise;
  }
  function clear(namespace) {
    promiseHash[namespace] = [];
  }
  function finished(namespace) {
    return $q.all(promiseHash[namespace])
      .then(function (promiseArray) {
        return promiseArray.length;
      });
  }

  return {
    add: add,
    clear: clear,
    finished: finished
  };
}
