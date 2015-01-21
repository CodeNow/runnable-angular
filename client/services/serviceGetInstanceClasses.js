'use strict';

require('app')
  .factory('getInstanceClasses', getInstanceClasses);
/**
 * @njInject
 */
function getInstanceClasses(
  $stateParams,
  keypather
) {
  return function (instance) {
    if (!instance) {
      return {}; //async loading handling
    }
    var container = keypather.get(instance, 'containers.models[0]');
    var build = keypather.get(instance, 'build');
    var h = {};
    var hasDeps = keypather.get(instance, 'dependencies.models.length');
    h.active = (instance.attrs.name === $stateParams.instanceName);
    h.expanded = (h.active && hasDeps);
    h.running = container && container.running();
    h.stopped = !h.running;
    h.building = build && !build.attrs.completed;
    h.failed = build && build.failed();
    return h;
  };
}
