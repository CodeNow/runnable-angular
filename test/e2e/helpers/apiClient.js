'use strict';

/**
 * Layout stuffs
 */
var windowHost = require('../../../client/config/json/api.json').host.toLowerCase();

var runnable = new (require('runnable'))('http:' + windowHost);
var RUNNABLE_DOOBIE_TOKEN = 'b03bb45cce257add52cdb60f9b096f5c28aa71d2';
module.exports = {
  runnable: runnable,
  fetchUser: function () {
    return this.promisify(runnable, 'githubLogin')(RUNNABLE_DOOBIE_TOKEN);
  },
  promisify: function (model, fn) {
    return function () {
      var d = protractor.promise.defer();
      var args = [].slice.call(arguments);
      var returnedVal;
      args.push(function (err) {
        if (err) {
          d.reject(err);
        } else {
          if (returnedVal) {
            return d.fulfill(returnedVal);
          }
          // It's a fetch/build/etc
          d.fulfill(model);
        }
      });
      returnedVal = model[fn].apply(model, args);
      return d.promise;
    };
  }
};
