require('app')
  .factory('errs', errs);

function errs (
  $rootScope
) {
  var errors = [];
  return {
    handler: function (err) {
      if (err) {
        errors.push(err);
        $rootScope.safeApply();
      }
    },
    errors: errors
  };
}


// When there's an error, we want to show a modal.