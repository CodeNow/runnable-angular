'use strict';

require('app')
  .factory('fetchSourceContexts', fetchSourceContexts);

function fetchSourceContexts(
  $q,
  fetchContexts
) {
  var sourceContexts;
  return function () {
    if (sourceContexts) {
      return $q.when(sourceContexts);
    }

    return fetchContexts({ isSource: true })
      .then(function (contexts) {
        sourceContexts = contexts;
        return contexts;
      });
  };
}