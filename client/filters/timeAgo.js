var app = require('app');
app.filter('timeAgo', function () {
  return function (date) {
    return require('moment')(date).fromNow();
  };
});