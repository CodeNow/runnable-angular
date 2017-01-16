'use strict';

require('app')
  .factory('reportInstanceFailures', reportInstanceFailures);

var errorsToNotReport = [
  /instance.*lowerName.*exists/i
];
function reportInstanceFailures(
  keypather,
  report
) {
  return function (err) {
    var errorMessage = keypather.get(err, 'message');
    var shouldReport = !errorsToNotReport.find(function (errMessage) {
      return errMessage.test(errorMessage);
    });
    if (shouldReport) {
      report.critical(err.message, {
        err: err
      });
    }
  };
}
