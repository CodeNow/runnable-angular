require('app')
  .factory('determineActiveAccount', determineActiveAccount);
/**
 * @ngInject
 */
function determineActiveAccount (
  $state,
  async,
  hasKeypaths,
  QueryAssist,
  user
) {
  return function (cb) {

    if(!angular.isFunction(cb)) throw new Error();

    var _user, _orgs;

    async.series([
      fetchUser,
      fetchOrgs,
      match
    ]);

    function fetchUser (cb) {
      new QueryAssist(user, cb)
        .wrapFunc('fetchUser')
        .query('me')
        .cacheFetch(function (user, cached, cb) {
          _user = user;
          cb();
        })
        .resolve(function (err, user, cb) {
          if (err) throw err;
        })
        .go();
    }

    function fetchOrgs (cb) {
      _orgs = _user.fetchGithubOrgs(function (err) {
        if (err) throw err;
        cb();
      });
    }

    function match () {
      if (!$state.params.userName || $state.params.userName === _user.oauthName()) {
        return cb(null, _user);
      }
      var currentOrg = _orgs.find(hasKeypaths({
        'attrs.login.toLowerCase()': $state.params.userName.toLowerCase()
      }));
      return cb(null, currentOrg);
    }

  };
}
