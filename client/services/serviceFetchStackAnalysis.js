'use strict';

require('app')
  .factory('fetchStackAnalysis', fetchStackAnalysis);

function fetchStackAnalysis(
  $q,
  user
) {
  return function (repo) {
    var d = $q.defer();
    function callback(err, res, body) {
      if (err) { return d.reject(err); }
      d.resolve(body);
    }
    user.client.get('/actions/analyze?repo=' + repo, callback);
    return d.promise;
  };
}