'use strict';

require('app')
  .filter('cardBuildStatusText', cardBuildStatusText);
/**
 * @ngInject
 */
function cardBuildStatusText(
  instanceStatus
) {
  return function (instance, includeDash) {
    var status = instanceStatus(instance);

    var statusMap = {
      'stopped': 'Stopped',
      'crashed': 'Crashed',
      'running': 'Running',
      'buildFailed': 'Build Failed',
      'building': 'Building',
      'unknown': 'unknown'
    };

    var returnString = includeDash ? '— ' : '';
    returnString += statusMap[status];
    return returnString;
  };
}
