'use strict';

var user = require('../apiMocks').user;

var runnable = new (require('runnable'))(window.host);

// Will not work until pFetchUser is modified
module.exports = function ($q) {
  return function () {
    var d = $q.defer();
    d.resolve(runnable.parse(user));
    return d.promise;
  };
};