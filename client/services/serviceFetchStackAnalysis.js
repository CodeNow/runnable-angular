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
  return function (fullRepoName) {
    var d = $q.defer();
    function callback(err, res, body) {
      if (err) { return d.reject(err); }
      d.resolve(body);
    }
    apiClientBridge.client.get('/actions/analyze?repo=' + fullRepoName, callback);
    return d.promise;
  };
}