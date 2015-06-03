'use strict';

require('app')
  .filter('timeAgo', function (moment) {
  function timeAgo (date) {
    if (!date) {
      return;
    }
    // force any dates in future to be no greater than now
    date = (new Date(date) > new Date()) ? new Date() : new Date(date);
    return moment(date).fromNow();
  }
  timeAgo.$stateful = true;
  return timeAgo;
});
