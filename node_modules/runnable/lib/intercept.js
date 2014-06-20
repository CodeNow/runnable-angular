'use strict';

module.exports = intercept;

function intercept (onError, next) {
  return function (err) {
    if (err) {
      onError(err);
    }
    else {
      var args = Array.prototype.slice.call(arguments, 1);
      next.apply(null, args);
    }
  };
}