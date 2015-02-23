'use strict';

require('app')
  .factory('fetchCoachMarkData', fetchCoachMarkData);

function fetchCoachMarkData(
  keypather,
  fetchUser,
  promisify,
  errs
) {
  return function (coachMarkKey, cb) {
    fetchUser(function (err, user) {
      errs.handler(err);
      // If the coach mark has been shown, just return null
      // if it hasn't, return an object with a save function on it
      var data =  keypather.get(
        user,
        'attrs.userOptions.uiState.shownCoachMarks.' + coachMarkKey
      ) ? null : {
        save: function () {
          var userOptions = {};
          userOptions['userOptions.uiState.shownCoachMarks.' + coachMarkKey] = true;
          // Make user update call here
          return promisify(user, 'update')(
            userOptions
          ).catch(errs.handler);
        }
      };
      cb(data);
    });
  };
}