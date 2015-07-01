'use strict';

require('app')
  .factory('getInstanceClasses', getInstanceClasses);
/**
 * @njInject
 */
function getInstanceClasses(
  $state,
  keypather
) {
  return function (instance) {
    if (!instance) {
      return {}; //async loading handling
    }
    var h = {};
    h.active = (keypather.get(instance, 'attrs.name') === $state.params.instanceName);

    var status = keypather.get(instance, 'status()');
    var statusMap = {
      'stopped': '',
      'crashed': 'red',
      'running': 'green',
      'buildFailed': 'red',
      'building': 'orange',
      'neverStarted': 'orange',
      'unknown': '',
      'starting': 'orange',
      'stopping': 'green'
    };
    h[statusMap[status]] = true;

    return h;
  };
}
