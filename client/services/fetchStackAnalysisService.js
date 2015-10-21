'use strict';

require('app')
  .factory('fetchStackAnalysis', fetchStackAnalysis);

/**
 * @name fetchStackAnalysis
 * @param $q
 * @param apiClientBridge
 * @returns {Function} fetchStackAnalysis
 */
function fetchStackAnalysis(
  $q,
  apiClientBridge
) {
  var stackAnalysisCache = {};
  return function (fullRepoName) {
    if (!stackAnalysisCache[fullRepoName]) {
      stackAnalysisCache[fullRepoName] = $q(function (resolve, reject) {
        function callback(err, res, body) {
          if (err) { return reject(err); }
          resolve(body);
        }
        apiClientBridge.client.get('/actions/analyze?repo=' + fullRepoName, callback);
      });
    }
    return stackAnalysisCache[fullRepoName];
  };
}