require('app')
  .factory('fetchInstances', fetchInstances);

function fetchInstances(
  fetchUser
) {
  var currentInstances;
  var currentAccountName;
  return function (activeAccountName, forceQuery, cb) {
    if (activeAccountName === currentAccountName && !forceQuery) {
      return cb(null, currentInstances, activeAccountName);
    } else {
      currentAccountName = activeAccountName;
      fetchUser(function (err, user) {
        currentInstances = user.fetchInstances({
          githubUsername: currentAccountName
        }, function (err) {
          cb(err, currentInstances, activeAccountName);
        });
      });
    }
  };
}
