'use strict';

var deferer = [];
module.exports = {
  triggerPromise: function(opts, index) {
    ((!index) ? deferer.pop() : deferer.splice(index, 1)[0]).resolve(opts);
  },
  triggerPromiseError: function(err, index) {
    ((!index) ? deferer.pop() : deferer.splice(index, 1)[0])
      .reject(err);
  },
  fetch: function ($q) {
    return function (opts) {
      var thisDeferer = $q.defer();
      deferer.push(thisDeferer);
      return thisDeferer.promise;
    };
  },
  clearDeferer: function () {
    deferer = [];
  }
};