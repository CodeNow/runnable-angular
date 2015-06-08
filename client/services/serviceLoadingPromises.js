'use strict';

require('app')
  .factory('loadingPromises', loadingPromises);

function loadingPromises(
  $q
) {
  var promiseHash = {};

  function add(namespace, promise) {
    if (!namespace) {
      return promise.then(function () {
        return $q.reject('LoadingPromises received a falsy namespace!!!');
      });
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
