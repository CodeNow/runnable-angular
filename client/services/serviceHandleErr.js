'use strict';

require('app')
  .factory('errs', errs);

function errs (
  configEnvironment,
  keypather,
  hasKeypaths,
  $log,
  report,
  configAPIHost,
  $window
) {
  // codes that do not need to be displayed to user
  var noDisplayCodes = [401, 403];
  var errors = [];

  function validErrorCheck(err) {
    if (!err) {
      return false;
    }
    if (err.message === 'Bad credentials') {
      $window.location = configAPIHost + '/auth/github?redirect=' + $window.location.protocol + '//' + $window.location.host + '/?auth';
      return false;
    }
    if (err.message === 'collection requires a client') {
      // Fuck this error
      return false;
    }

    if (~noDisplayCodes.indexOf(keypather.get(err, 'data.statusCode'))) { return false; }
    return true;
  }
  function reportError(err, emitter) {
    if (validErrorCheck(err)) {
      if (configEnvironment !== 'production') {
        $log.error(err);
      } else {
        report.error(err, {
          emitter: emitter || 'Error Reporter'
        });
      }
    }
  }

  return {
    handler: function (err) {
      if (validErrorCheck(err)) {
        reportError(err, 'Error Popup');
        if (!errors.find(hasKeypaths({ 'message': err.message }))) {
          errors.push(err);
        }
      }
    },
    report: reportError,
    clearErrors: function () {
      while (errors.length > 0) {
        errors.pop();
      }
    },
    errors: errors
  };
}