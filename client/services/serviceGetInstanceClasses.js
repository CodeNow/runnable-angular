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
    var container = keypather.get(instance, 'containers.models[0]');
    var build = keypather.get(instance, 'build');
    var h = {};
    h.active = (instance.attrs.name === $state.params.instanceName);
    if (container && container.running()) {
      h.green = true;
    } else if (build && !build.attrs.completed) {
      h.orange = true;
    } else {
      h.red = true;
    }
    return h;
  };
}
