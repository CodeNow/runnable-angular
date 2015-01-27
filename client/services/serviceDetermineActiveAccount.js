'use strict';

require('app')
  .factory('determineActiveAccount', determineActiveAccount);
/**
 * @ngInject
 */
function determineActiveAccount(
  $stateParams,
  hasKeypaths,
  pFetchUser,
  promisify
) {
  return function (cb) {

    if (!angular.isFunction(cb)) { throw new Error('cb is required'); }

    var _user, _orgs;

    pFetchUser.then(function(user) {
      _user = user;
      var ghFetch = promisify(user, 'fetchGithubOrgs');
      return ghFetch();
    }).then(function(orgs) {
      _orgs = orgs;
      if (!$stateParams.userName || $stateParams.userName === _user.oauthName()) {
        cb(null, _user);
        return;
      }
      var currentOrg = _orgs.find(hasKeypaths({
        'attrs.login.toLowerCase()': $stateParams.userName.toLowerCase()
      }));
      cb(null, currentOrg);
    });

    // async.waterfall([
    //   function (cb) {
    //     fetchUser(function(err, user) {
    //       if (err) { return cb(err); }
    //       _user = user;
    //       cb();
    //     });
    //   },
    //   fetchOrgs,
    //   match
    // ], cb);

    // function fetchOrgs(cb) {
    //   _orgs = _user.fetchGithubOrgs(function (err) {
    //     if (err) { throw err; }
    //     cb();
    //   });
    // }

    // function match(cb) {
    //   if (!$stateParams.userName || $stateParams.userName === _user.oauthName()) {
    //     cb(null, _user);
    //     return;
    //   }
    //   var currentOrg = _orgs.find(hasKeypaths({
    //     'attrs.login.toLowerCase()': $stateParams.userName.toLowerCase()
    //   }));
    //   cb(null, currentOrg);
    // }

  };
}
