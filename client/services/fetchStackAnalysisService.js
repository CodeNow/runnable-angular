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
          // should be an array of [res, body], we want body
          if (Array.isArray(headerAndData) && headerAndData.length === 2) {
            return headerAndData[1];
          }
          return headerAndData;
        });
    }
    return stackAnalysisCache[fullRepoName];
  };
}