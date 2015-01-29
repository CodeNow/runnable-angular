'use strict';

var builds = require('../apiMocks').builds;

var runnable = new (require('runnable'))('http://example.com/');

module.exports = {
  built: function ($q) {
    return function ($buildId) {
      var d = $q.defer();
      var built = runnable.newBuild(builds.built);
      d.resolve(built);
      return d.promise;
    };
  },
  error: function($q) {
    return function($buildId) {
      var d = $q.defer();
      d.reject('http://cdn2.holytaco.com/wp-content/uploads/images/2009/12/Cat_FAIL-1.jpg');
      return d.promise;
    };
  }
};