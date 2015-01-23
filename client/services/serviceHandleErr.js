'use strict';

require('app')
  .factory('errs', errs);

function errs (
  keypather,
  $log
) {
  // codes that do not need to be displayed to user
  var noDisplayCodes = [401, 403];
  var errors = [];
  return {
    handler: function (err) {
      if (err) {
        if (~noDisplayCodes.indexOf(keypather.get(err, 'data.statusCode'))) { return; }
        errors.push(err);
        if (process.env.NODE_ENV !== 'production') {
          $log.error(err);
        }
      }
    },
    clearErrors: function () {
      errors = [];
    },
    errors: errors
  };
}
