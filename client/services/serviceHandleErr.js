require('app')
  .factory('errs', errs);

function errs (
  keypather
) {
  // codes that do not need to be displayed to user
  var noDisplayCodes = [401, 403];
  var errors = [];
  return {
    handler: function (err) {
      if (err) {
        if (~noDisplayCodes.indexOf(keypather.get(err, 'data.statusCode'))) { return; }
        errors.push(err);
      }
    },
    errors: errors
  };
}
