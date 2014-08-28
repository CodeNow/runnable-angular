require('app')
  .filter('humanizeTimeDuration', filterHumanizeTimeDuration);
/**
 * @ngInject
 */
function filterHumanizeTimeDuration(
  moment
) {
  return function (timeDiff) {
    if (isNaN(timeDiff)) {
      return 'Still building...';
    }
    return moment.duration(timeDiff).humanize();
  };
}
