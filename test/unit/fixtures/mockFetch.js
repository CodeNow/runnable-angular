'use strict';

var deferer = [];
module.exports = {
  triggerPromise: function(opts, index) {
    ((!index) ? deferer.pop() : deferer.splice(index, 1)[0]).resolve(opts);
  },
  triggerPromiseError: function(opts, index) {
    ((!index) ? deferer.pop() : deferer.splice(index, 1)[0])
      .reject('http://cdn2.holytaco.com/wp-content/uploads/images/2009/12/Cat_FAIL-1.jpg');
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