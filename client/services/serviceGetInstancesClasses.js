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
    h.active = (instance.attrs.name === $stateParams.instanceName);
    h.running = container && container.running();
    h.stopped = !h.running;
    h.building = build && !build.attrs.completed;
    h.failed = build && build.failed();
    return h;
  };
}
