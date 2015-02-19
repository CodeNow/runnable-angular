'use strict';

var mockFetch = function () {
  this.deferer = [];
};
mockFetch.prototype.triggerPromise = function (opts, index) {
  ((!index) ? this.deferer.pop() : this.deferer.splice(index, 1)[0]).resolve(opts);
};
mockFetch.prototype.triggerPromiseError = function (err, index) {
  ((!index) ? this.deferer.pop() : this.deferer.splice(index, 1)[0]).reject(err);
};
mockFetch.prototype.fetch = function () {
  var self = this;
  return function ($q) {
    return function (opts) {
      var thisDeferer = $q.defer();
      self.deferer.push(thisDeferer);
      return thisDeferer.promise;
    };
  };
};
mockFetch.prototype.clearDeferer = function () {
  this.deferer = [];
};

module.exports = mockFetch;