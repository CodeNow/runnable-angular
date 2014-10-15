require('app')
  .factory('holdUntilAuth', holdUntilAuth);
/**
 * holdUntilAuth
 * @ngInject
 */
function holdUntilAuth(
  user
) {
  /**
   * Requires api-client to consider in-progress requests
   * and not make duplicate HTTP requests for the same
   * resource
   */
  var thisUser;
  return function (cb) {
    if (!angular.isFunction(cb)) {
      cb = angular.noop;
    }
    if (thisUser) {
      cb(null, thisUser);
    } else {
      thisUser = user.fetch('me', function (err) {
        cb(err, thisUser);
      });
    }
  };
}
