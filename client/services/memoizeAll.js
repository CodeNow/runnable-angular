'use strict';
require('app')
  .factory('memoizeAll', function (memoize) {
    return function (fn) {
      var resolver = function () {
        var args = [].slice.call(arguments);
        return JSON.stringify(args);
      };
      return memoize(fn, resolver);
    };
  });
