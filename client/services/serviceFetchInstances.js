require('app')
  .factory('fetchInstances', fetchInstances);

function fetchInstances(
  fetchUser
) {
  var currentInstances;
  var currentAccountName;
  return function (activeAccountName, forceQuery, cb) {
    if (activeAccountName === currentAccountName && !forceQuery && currentInstances) {
      return cb(null, currentInstances, activeAccountName);
    } else {
      currentAccountName = activeAccountName;
      fetchUser(function (err, user) {
        if (!user) { return cb(err); }
        currentInstances = user.fetchInstances({
          githubUsername: currentAccountName
        }, function (err) {
          if (currentAccountName === activeAccountName) {
            cb(err, currentInstances, activeAccountName);
          }
        });
      });
    }
  };
}
