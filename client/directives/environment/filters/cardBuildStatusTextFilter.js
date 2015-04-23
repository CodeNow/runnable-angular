'use strict';

require('app')
  .filter('cardBuildStatusText', cardBuildStatusText);
/**
 * @ngInject
 */
function cardBuildStatusText(
  keypather
) {
  return function (instance) {
    var container = keypather.get(instance, 'containers.models[0]');
    var build = keypather.get(instance, 'build');
    if (container) {
      if (container.running()) {
        return 'Running';
      } else if (keypather.get(container, 'attrs.inspect.State.ExitCode') === -1) {
        // -1 means a user killed it
        return 'Stopped';
      } else {
        return 'Crashed';
      }
    } else if (build) {
      if (build.failed()) {
        return 'Building Failed';
      } else {
        return 'Building';
      }
    }
  };
}
