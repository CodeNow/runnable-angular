'use strict';

require('app')
  .factory('fetchStackAnalysis', fetchStackAnalysis);

/**
 * @name fetchStackAnalysis
 * @param apiClientBridge
 * @returns {Function} fetchStackAnalysis
 */
function fetchStackAnalysis(
  apiClientBridge
) {
  var stackAnalysisCache = {};
  return function (fullRepoName) {
    if (!stackAnalysisCache[fullRepoName]) {
      stackAnalysisCache[fullRepoName] = apiClientBridge.client.getAsync('/actions/analyze?repo=' + fullRepoName)
        .then(function (headerAndData) {
          if (Array.isArray(headerAndData)) {
            return headerAndData[headerAndData.length - 1];
          }
          return headerAndData;
        });
    }
    return stackAnalysisCache[fullRepoName];
  };
}