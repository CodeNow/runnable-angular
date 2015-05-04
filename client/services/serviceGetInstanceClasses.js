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

    if (container) {
      if (container.running()) {
        // Running
        h.green = true;
      } else {
        //Crashed
        h.red = true;
      }
    } else if (build) {
      if (build.failed()) {
        // Build Failure
        h.red = true;
      } else {
        // Building
        h.orange = true;
      }
    }

    return h;
  };
}
