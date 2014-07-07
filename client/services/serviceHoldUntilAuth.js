require('app')
  .factory('holdUntilAuth', holdUntilAuth);
/**
 * holdUntilAuth
 * @ngInject
 */
function holdUntilAuth (user) {
  return function (cb) {
    if (!angular.isFunction(cb)) {
      cb = angular.noop;
    }
    var thisUser = user.fetchUser('me', function (err, result) {
      cb(err, thisUser);
    });
    if (thisUser.id() && thisUser.id() !== 'me') {
      cb(null, thisUser);
      cb = angular.noop;
    }
  };
}
