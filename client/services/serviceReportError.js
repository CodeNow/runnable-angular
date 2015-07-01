'use strict';

require('app')
  .factory('reportError', reportError);

function reportError() {
  return function (err, options) {
    if (window.NREUM) {
      window.NREUM.noticeError(err, options);
    }
  };
}
