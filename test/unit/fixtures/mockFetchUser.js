'use strict';

var user = require('../apiMocks').user;

var runnable = new (require('runnable'))(window.host);

module.exports = function ($q) {
  return function () {
    var d = $q.defer();
    var thisUser = runnable.parse(user);
    thisUser.oauthName = function () {
      return thisUser.accounts.github.username;
    };
    d.resolve(thisUser);
    return d.promise;
  };
};