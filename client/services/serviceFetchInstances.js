require('app')
  .factory('fetchInstances', fetchInstances);

function fetchInstances(
  fetchUser,
  QueryAssist,
  errs
) {
  var currentAccountName;
  return function (activeAccountName, forceQuery, cb) {
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
            cb(err, instances, activeAccountName);
          }
        })
        .resolve(errs.handler)
        .go();
    });
  };
}
