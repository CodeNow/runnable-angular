'use strict';

// Note: that this will return times in the future.
// Use the "timeAgo" if you want to enforce past times.
require('app')
  .filter('timeFrom', function (moment) {
  function timeFrom (date) {
    return (!date) ? undefined : moment(date).fromNow();
  }
  timeFrom.$stateful = true;
  return timeFrom;
});
