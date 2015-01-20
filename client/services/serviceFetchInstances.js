'use strict';

require('app')
  .factory('fetchInstances', fetchInstances);

function fetchInstances(
  fetchUser,
  QueryAssist,
  errs
) {
  var currentAccountName;
  var currentInstanceList;
  return function (activeAccountName, forceQuery, cb) {
    if (!activeAccountName) {
      return cb(null, currentInstanceList, currentAccountName);
    }
    currentAccountName = activeAccountName;
    fetchUser(function (err, user) {
      if (!user) { return cb(err); }
      new QueryAssist(user, cb)
        .wrapFunc('fetchInstances')
        .query({
          githubUsername: activeAccountName
        })
        .cacheFetch(function (instances, cached, cb) {
          if (currentAccountName === activeAccountName) {
            currentInstanceList = instances;
            cb(err, instances, activeAccountName, cached);
          }
        })
        .resolve(errs.handler)
        .go();
    });
  };
}
