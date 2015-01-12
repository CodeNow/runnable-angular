'use strict';

require('app')
  .factory('fetchGSDepInstances', fetchGSDepInstances);

function fetchGSDepInstances(
  fetchUser,
  QueryAssist,
  errs
) {
  return function (cb) {
    fetchUser(function (err, user) {
      if (!user) { return cb(err); }
      new QueryAssist(user, cb)
        .wrapFunc('fetchInstances')
        .query({
          githubUsername: 'HelloRunnable'
        })
        .cacheFetch(function (instances, cached, cb) {
          cb(err, instances);
        })
        .resolve(errs.handler)
        .go();
    });
  };
}
