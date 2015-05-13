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
      'buildFailed': 'Build Failed',
      'building': 'Building'
    };

    if (~['running', 'unknown'].indexOf(status)) {
      return '';
    }

    var returnString = includeDash ? '— ' : '';
    returnString += statusMap[status];
    return returnString;
  };
}
