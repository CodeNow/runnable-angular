require('app')
  .factory('errs', errs);

function errs (
  $rootScope,
  keypather
) {
  var errors = [];
  return {
    handler: function (err) {
      if (err) {
        // 401 does not need to be displayed to user
        if (keypather.get(err, 'data.statusCode') === 401) { return; }
        errors.push(err);
        $rootScope.safeApply();
      }
    },
    errors: errors
  };
}
