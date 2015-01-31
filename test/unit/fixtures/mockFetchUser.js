'use strict';

var user = require('../apiMocks').user;

var runnable = new (require('runnable'))(window.host);

module.exports = function ($q) {
  return function () {
    var d = $q.defer();
    d.resolve(runnable.parse(user));
    return d.promise;
  };
};