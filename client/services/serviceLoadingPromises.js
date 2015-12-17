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
      .then($q.all(promiseHash[namespace]))
      .then(function (promiseArray) {
        return promiseArray ? promiseArray.length : 0;
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
