'use strict';

require('app')
  .factory('fetchSourceContexts', fetchSourceContexts);

function fetchSourceContexts(
  fetchContexts
) {
  var sourceContextsPromise;
  return function () {
    if (!sourceContextsPromise) {
      sourceContextsPromise = fetchContexts({ isSource: true })
        .then(function (contexts) {
          return contexts;
        });
    }
    return sourceContextsPromise;
  };
}