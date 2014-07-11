require('app')
  .factory('holdUntilAuth', holdUntilAuth);
/**
 * holdUntilAuth
 * @ngInject
 */
function holdUntilAuth(user) {
  return function (cb) {
    var called = false;
    if (!angular.isFunction(cb)) {
      cb = angular.noop;
    }
    var thisUser = user.fetchUser('me', function (err, result) {
      if (called) {
        return;
      }
      cb(err, thisUser);
    });
    if (thisUser.id() && thisUser.id() !== 'me') {
      cb(null, thisUser);
      called = true;
      //cb = angular.noop;
    }
  };
}
