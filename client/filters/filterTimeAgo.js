// TODO include moment via service TJ made
var moment = require('moment');
require('app')
  .filter('timeAgo', timeAgo);

function timeAgo() {
  return function (date) {
    return moment(date).fromNow();
  };
}
