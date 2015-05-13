'use strict';

require('app')
  .factory('getInstanceClasses', getInstanceClasses);
/**
 * @njInject
 */
function getInstanceClasses(
  $state,
  instanceStatus
) {
  return function (instance) {
    if (!instance) {
      return {}; //async loading handling
    }
    var h = {};
    h.active = (instance.attrs.name === $state.params.instanceName);

    var status = instanceStatus(instance);
    var statusMap = {
      'stopped': 'red',
      'crashed': 'red',
      'running': 'green',
      'buildFailed': 'red',
      'building': 'orange',
      'unknown': 'orange'
    };
    h[statusMap[status]] = true;

    return h;
  };
}
