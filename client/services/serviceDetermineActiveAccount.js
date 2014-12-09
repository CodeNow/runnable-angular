require('app')
  .factory('determineActiveAccount', determineActiveAccount);
/**
 * @ngInject
 */
function determineActiveAccount(
  $stateParams,
  async,
  hasKeypaths,
  QueryAssist,
  user
) {
  return function (cb) {

    if (!angular.isFunction(cb)) { throw new Error('cb is required'); }

    var _user, _orgs;

    async.waterfall([
      fetchUser,
      fetchOrgs,
      match
    ], cb);

    function fetchUser(cb) {
      new QueryAssist(user, cb)
        .wrapFunc('fetchUser')
        .query('me')
        .cacheFetch(function (user, cached, cb) {
          _user = user;
          cb();
        })
        .resolve(function (err, user, cb) {
          if (err) { throw err; }
        })
        .go();
    }

    function fetchOrgs(cb) {
      _orgs = _user.fetchGithubOrgs(function (err) {
        if (err) { throw err; }
        cb();
      });
    }

    function match(cb) {
      if (!$stateParams.userName || $stateParams.userName === _user.oauthName()) {
        cb(null, _user);
        return;
      }
      var currentOrg = _orgs.find(hasKeypaths({
        'attrs.login.toLowerCase()': $stateParams.userName.toLowerCase()
      }));
      cb(null, currentOrg);
    }

  };
}
