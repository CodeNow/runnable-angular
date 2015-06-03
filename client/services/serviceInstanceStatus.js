'use strict';

require('app')
  .factory('instanceStatus', instanceStatus);


/*
Returns one of these:

stopped
crashed
running
buildFailed
building
unknown

 */
function instanceStatus(keypather) {
  var jesusBirthday = '0001-01-01T00:00:00Z';
  return function (instance) {
    var container = keypather.get(instance, 'containers.models[0]');
    var build = keypather.get(instance, 'build');
    if (container) {
      if (!container.running()) {
        if (keypather.get(container, 'attrs.inspect.State.ExitCode') === -1) {
          return 'stopped';
        }
        if (keypather.get(container, 'attrs.inspect.State.StartedAt') === jesusBirthday) {
          // container has been deployed but not yet started
          return 'building';
        }
        return 'crashed';
      }
      return 'running';
    }
    if (build) {
      if (build.failed()) {
        return 'buildFailed';
      }
      return 'building';
    }

    return 'unknown';
  };
}
