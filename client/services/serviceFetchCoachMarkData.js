'use strict';

require('app')
  .factory('fetchCoachMarkData', fetchCoachMarkData);

function fetchCoachMarkData(
  keypather,
  $rootScope,
  errs,
  user
) {
  return function (coachMarkKey, cb) {
    var unwatch = $rootScope.$watch('dataApp.data.user', function (n) {
      if (n) {
        unwatch();
        // If the coach mark has been shown, just return null
        // if it hasn't, return an object with a save function on it
        var data =
          keypather.get(n, 'attrs.userOptions.uiState.shownCoachMarks.' + coachMarkKey) ? null : {
            save: function () {
              var userOptions = keypather.get(n, 'attrs.userOptions') || {};
              keypather.set(userOptions, 'uiState.shownCoachMarks.' + coachMarkKey, true);
              // Make user update call here
              user.update({userOptions: userOptions}, function (err) {
                errs.handler(err);
              });
            }
          };
        cb(data);
      }
    });
  };
}