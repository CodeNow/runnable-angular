require('app')
  .filter('humanizeTimeDuration', filterHumanizeTimeDuration);
/**
 * @ngInject
 */
function filterHumanizeTimeDuration (
  moment
) {
  return function (timeDiff) {
    moment.duration(timeDiff).humanize();
  };
}
