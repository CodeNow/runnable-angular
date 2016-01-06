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

  function reportError(err, emitter) {
    if (err) {
      if (err.message === 'Bad credentials') {
        window.location = configAPIHost + '/auth/github?redirect=' + $window.location.protocol + '//' + $window.location.host + '/?auth';
        return;
      }

      if (~noDisplayCodes.indexOf(keypather.get(err, 'data.statusCode'))) { return; }
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
      if (err) {
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