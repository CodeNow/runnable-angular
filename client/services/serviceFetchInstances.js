'use strict';

require('app')
  .factory('fetchInstances', fetchInstances);

function fetchInstances(
  pFetchInstances
) {
  var currentAccountName;
  var currentInstanceList;
  return function (activeAccountName, forceQuery, cb) {
    if (!activeAccountName) {
      return cb(null, currentInstanceList, currentAccountName);
    }
    currentAccountName = activeAccountName;
    // FIXME: This is a wrapper around pFetchInstances to take advantage of the caching
    // Remove this layer before being merged with master
    pFetchInstances()
    .then(function(instances) {
      cb(null, instances, activeAccountName);
    }).catch(cb);
  };
}
