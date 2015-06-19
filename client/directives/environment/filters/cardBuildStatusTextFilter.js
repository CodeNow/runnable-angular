'use strict';

require('app')
  .filter('cardBuildStatusText', cardBuildStatusText);
/**
 * @ngInject
 */
function cardBuildStatusText(
  keypather
) {
  return function (instance, includeDash) {
    var status = keypather.get(instance, 'status()');

    var statusMap = {
      stopped: 'Stopped',
      crashed: 'Crashed',
      buildFailed: 'Build Failed',
      building: 'Building',
      neverStarted: 'Building',
      starting: 'Starting',
      stopping: 'Stopping',
    };

    if (~['running', 'unknown'].indexOf(status)) {
      return '';
    }

    var returnString = includeDash ? '— ' : '';
    returnString += statusMap[status];
    return returnString;
  };
}
