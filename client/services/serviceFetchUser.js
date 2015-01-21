'use strict';

require('app')
  .factory('fetchUser', fetchUser);

function fetchUser (
  $state,
  keypather,
  user
) {
  return function (cb) {
    if (user.attrs && user.attrs.accounts) {
      return cb(null, user);
    }
    user.fetch('me', function (err) {
      if (err && keypather.get(err, 'data.statusCode') === 401 &&
          !keypather.get($state, 'current.data.anon')) {
        $state.go('home');
        return cb(err);
      }
      cb(err, user);
    });
  };
}
