require('app')
  .factory('getInstanceAltTitle', getInstanceAltTitle);
/**
 * @ngInject
 */
function getInstanceAltTitle(
  $filter,
  getInstanceClasses,
  keypather
) {
  return function (instance) {
    var state = getInstanceClasses(instance);
    if (state.failed) {
      return "Build failed";
    }
    if (state.running) {
      return "Started " + $filter('timeAgo')(keypather.get(instance, 'containers.models[0].attrs.inspect.State.StartedAt'));
    }
    if (state.stopped) {
      return "Stopped " + $filter('timeAgo')(keypather.get(instance, 'containers.models[0].attrs.inspect.State.FinishedAt'));
    }
    if (state.building) {
      return "Build in progress";
    }
    return "";
  };
}
