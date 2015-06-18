'use strict';

var User = require('runnable/lib/models/user');
var user = require('../apiMocks').user;
var runnable = window.runnable;

module.exports = function ($q) {
  return function () {
    var d = $q.defer();
    var thisUser = runnable.parse(user);
    thisUser.oauthName = function () {
      return thisUser.accounts.github.username;
    };
    thisUser = new User(angular.copy(thisUser));
    d.resolve(thisUser);
    return d.promise;
  };
};
