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
    h.green = container && container.running();
    h.stopped = !h.running;
    h.orange = build && !build.attrs.completed;
    if (!(h.green || h.orange)) {
      h.red = (build && build.failed()) || !h.running;
    }
    return h;
  };
}
