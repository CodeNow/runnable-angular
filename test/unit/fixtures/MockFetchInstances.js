'use strict';

var instances = require('../apiMocks').instances;

var runnable = new (require('runnable'))('http://example.com/');

var deferer = [];
module.exports = {
  fireOnDemandPromise: function(opts, index) {
    if (index) {
      deferer.splice(index, 1).resolve(opts);
    } else {
      deferer.pop().resolve(opts);
    }
  },
  one: function ($q) {
    return function (opts) {
      var d = $q.defer();
      var instance = runnable.newInstance(instances.running);
      d.resolve(instance);
      return d.promise;
    };
  },
  onDemand: function ($q) {
    return function (opts) {
      var thisDeferer = $q.defer();
      deferer.push(thisDeferer);
      return thisDeferer.promise;
    };
  },
  error: function($q) {
    return function(opts) {
      var d = $q.defer();
      d.reject('http://cdn2.holytaco.com/wp-content/uploads/images/2009/12/Cat_FAIL-1.jpg');
      return d.promise;
    };
  },
  clearDeferer: function () {
    deferer = [];
  }
};