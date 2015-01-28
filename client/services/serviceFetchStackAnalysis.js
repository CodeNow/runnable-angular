'use strict';

require('app')
  .factory('fetchStackAnalysis', fetchStackAnalysis);

function fetchStackAnalysis(
  user
) {
  return function (repo, cb) {
    function callback(err, res, body) {
      cb(err, body);
    }
    user.client.get('/actions/analyze?repo=' + repo, callback);
  };
}