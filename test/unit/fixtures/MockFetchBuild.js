'use strict';

var builds = require('../apiMocks').builds;

var runnable = window.runnable;

module.exports = {
  built: function ($q) {
    return function ($buildId) {
      var d = $q.defer();
      var built = runnable.newBuild(builds.built);
      d.resolve(built);
      return d.promise;
    };
  },
  setup: function($q) {
    return function ($buildId) {
      var d = $q.defer();
      var built = runnable.newBuild(builds.setup);
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