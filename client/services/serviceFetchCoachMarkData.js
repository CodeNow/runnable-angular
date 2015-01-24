'use strict';

require('app')
  .factory('fetchCoachMarkData', fetchCoachMarkData);

function fetchCoachMarkData(
  keypather,
  $rootScope
) {
  return function (coachMarkKey) {
    var data = keypather.get($rootScope, 'dataApp.data.user.coachMarkData.' + coachMarkKey) || {
      save: function () {
        // Make user update call here
        keypather.set(
          $rootScope,
          'dataApp.data.user.coachMarkData.' + coachMarkKey + '.hasBeenViewed',
          true
        );
        data.hasBeenViewed = true;
      }
    };
    return data;
  };
}