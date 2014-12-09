require('app')
  .factory('fetchUser', fetchUser);

function fetchUser (
  user
) {
  var currentUser;
  return function (cb) {
    if (currentUser) {
      return cb(null, currentUser);
    }
    var tempUser = user.fetchUser('me', function (err) {
      currentUser = tempUser;
      cb(err, currentUser);
    });
  };
}
