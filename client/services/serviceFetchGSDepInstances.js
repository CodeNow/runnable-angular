'use strict';

require('app')
  .factory('fetchGSDepInstances', fetchGSDepInstances);

function fetchGSDepInstances(
  fetchInstances
) {
  // FIXME: redundant wrapper
  return function (cb) {
    fetchInstances({
      githubUsername: 'HelloRunnable'
    })
    .then(function(instances) {
      cb(null, instances);
    }).catch(cb);
  };
}
