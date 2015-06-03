'use strict';

require('app')
  .factory('getInstanceClasses', getInstanceClasses);
/**
 * @njInject
 */
function getInstanceClasses(
  $state
) {
  return function (instance) {
    if (!instance) {
      return {}; //async loading handling
    }
    var h = {};
    h.active = (instance.attrs.name === $state.params.instanceName);

    var status = instance.status();
    var statusMap = {
      'stopped': '',
      'crashed': 'red',
      'running': 'green',
      'buildFailed': 'red',
      'building': 'orange',
      'neverStarted': 'orange',
      'unknown': 'orange'
    };
    h[statusMap[status]] = true;

    return h;
  };
}
