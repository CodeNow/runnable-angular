'use strict';

require('app')
  .factory('fetchCoachMarkData', fetchCoachMarkData);

function fetchCoachMarkData(
  keypather,
  fetchUser,
  errs
) {
  return function (coachMarkKey, cb) {
    fetchUser(function (err, user) {
      errs.handler(err);
      // If the coach mark has been shown, just return null
      // if it hasn't, return an object with a save function on it
      var data = {
        save: function () {
          var userOptions = {};
          userOptions['userOptions.uiState.shownCoachMarks.' + coachMarkKey] = true;
          // Make user update call here
          user.update(userOptions, function (err) {
            errs.handler(err);
          });
        }
      };
      cb(data);
    });
  };
}