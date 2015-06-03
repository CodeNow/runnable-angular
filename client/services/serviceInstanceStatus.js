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
  var jesusBirthday = new Date('0001-01-01T00:00:00Z').valueOf();
  return function (instance) {
    var container = keypather.get(instance, 'containers.models[0]');
    var build = keypather.get(instance, 'build');
    if (container) {
      if (!container.running()) {
        if (keypather.get(container, 'attrs.inspect.State.ExitCode') === -1) {
          return 'stopped';
        }
        if (keypather.get(container, 'attrs.inspect.State.ExitCode') === 0 &&
            new Date(keypather.get(container, 'attrs.inspect.State.StartedAt')).valueOf() === jesusBirthday) {
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
