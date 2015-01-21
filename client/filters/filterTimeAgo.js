'use strict';

// TODO include moment via service TJ made
var moment = require('moment');
require('app')
  .filter('timeAgo', timeAgo);

function timeAgo() {
  return function (date) {
    if (!date) {
      return;
    }
    // force any dates in future to be no greater than now
    date = (new Date(date) > new Date()) ? new Date() : new Date(date);
    return moment(date).fromNow();
  };
}
