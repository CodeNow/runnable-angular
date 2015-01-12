'use strict';

require('app')
  .factory('fetchOrgs', fetchOrgs);

function fetchOrgs (
  fetchUser
) {
  var currentOrgs;
  return function (cb) {
    if (currentOrgs) {
      return cb(null, currentOrgs);
    } else {
      fetchUser(function (err, user) {
        currentOrgs = user.fetchGithubOrgs(function (err) {
          cb(err, currentOrgs);
        });
      });
    }
  };
}
