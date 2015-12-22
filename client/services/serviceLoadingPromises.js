'use strict';

require('app')
  .factory('loadingPromises', loadingPromises);

function loadingPromises(
  $q
) {
  var promiseStartHash = {};
  var promiseHash = {};

  function add(namespace, promise) {
    if (!namespace) {
      return promise;
    }
    if (!promiseHash[namespace]) {
      promiseHash[namespace] = [];
    }
    promiseHash[namespace].push(promise);
    return promise;
  }
  /**
   * Start
   * 
   * This promise represents the start of a transaction, like the creation of the contextVersion
   * at the beginning of opening the edit modal.  This promise is still used in the .finished()
   * result, but isn't included in the promise count.  It does not clear out the promises 
   * stored in the promiseHash, since it's possible to want to change the start, but keep the
   * change history
   * 
  **/
  function start(namespace, promise) {
    if (!namespace) {
      return promise;
    }
    promiseStartHash[namespace] = promise;
    promiseHash[namespace] = promiseHash[namespace] || [];
    return promise;
  }
  function clear(namespace, preserveStart) {
    promiseHash[namespace] = [];
    if (!preserveStart) {
      promiseStartHash[namespace] = null;
    }
  }
  function finished(namespace) {
    return $q.when(promiseStartHash[namespace])
      .then(function () {
        return $q.all(promiseHash[namespace]);
      })
      .then(function (promiseArray) {
        return promiseArray.length;
      });
  }
  function getCount(namespace) {
    if (!promiseHash[namespace]) {
      return 0;
    }
    return promiseHash[namespace].length;
  }

  return {
    add: add,
    clear: clear,
    finished: finished,
    start: start,
    count: getCount
  };
}
