require('app')
  .filter('timeAgo', timeAgo);

function timeAgo() {
  return function (date) {
    return require('moment')(date).fromNow();
  };
}
