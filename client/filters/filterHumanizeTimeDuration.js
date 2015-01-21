'use strict';

require('app')
  .filter('humanizeTimeDuration', filterHumanizeTimeDuration);
/**
 * @ngInject
 */
function filterHumanizeTimeDuration(
  moment
) {
  return function (timeDiff) {
    return moment.duration(timeDiff).humanize();
  };
}
