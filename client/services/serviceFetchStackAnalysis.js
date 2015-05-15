'use strict';

require('app')
  .factory('fetchStackAnalysis', fetchStackAnalysis);

/**
 * @name fetchStackAnalysis
 * @param $q
 * @param user
 * @returns {Function} fetchStackAnalysis
 */
function fetchStackAnalysis(
  $q,
  user
) {
  return function (fullRepoName) {
    var d = $q.defer();
    function callback(err, res, body) {
      if (err) { return d.reject(err); }
      d.resolve(body);
    }
    user.client.get('/actions/analyze?repo=' + fullRepoName, callback);
    return d.promise;
  };
}