'use strict';

// TODO include moment via service TJ made
var moment = require('moment');
require('app')
  .filter('timeFrom', timeFrom);

// Note: that this will return times in the future.
// Use the "timeAgo" if you want to enforce past times.
function timeFrom() {
  return function (date) {
  	return (!date) ? undefined : moment(date).fromNow();
  };
}
