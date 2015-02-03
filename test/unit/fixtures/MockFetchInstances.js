'use strict';

var instances = require('../apiMocks').instances;

var runnable = new (require('runnable'))(window.host);

module.exports = {
  list: function($q) {
    return function (opts) {
      console.log('list', opts);
      var d = $q.defer();
      var instanceCollection = runnable.newInstances(instances.list, {
        noStore: true
      });
      d.resolve(instanceCollection);
      return d.promise;
    };
  },
  running: function ($q) {
    return function (opts) {
      expect(opts).to.be.an.Object;
      expect(opts.name).to.be.a.String;
      expect(opts.githubUsername).to.not.be.ok;
      var d = $q.defer();
      var running = runnable.newInstance(instances.running);
      d.resolve(running);
      return d.promise;
    };
  },
  error: function($q) {
    return function(opts) {
      var d = $q.defer();
      d.reject('http://cdn2.holytaco.com/wp-content/uploads/images/2009/12/Cat_FAIL-1.jpg');
      return d.promise;
    };
  }
};