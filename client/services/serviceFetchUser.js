require('app')
  .factory('fetchUser', fetchUser);

function fetchUser (
  $state,
  keypather,
  user
) {
  var currentUser;
  return function (cb) {
    if (currentUser) {
      return cb(null, currentUser);
    }
    var tempUser = user.fetchUser('me', function (err) {
      if (err && keypather.get(err, 'data.statusCode') === 401 &&
          !$state.current.data.anon) {
        $state.go('home');
        return cb(err);
      }
      currentUser = tempUser;
      cb(err, currentUser);
    });
  };
}
