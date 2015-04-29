'use strict';

require('app')
  .filter('cardBuildStatusText', cardBuildStatusText);
/**
 * @ngInject
 */
function cardBuildStatusText(
  keypather
) {
  return function (instance, includeDash) {
    var container = keypather.get(instance, 'containers.models[0]');
    var build = keypather.get(instance, 'build');
    var returnString = includeDash ? '— ' : null;
    if (container) {
      if (!container.running()) {
        returnString += 'Crashed';
      } else if (keypather.get(container, 'attrs.inspect.State.ExitCode') === -1) {
        // -1 means a user killed it
        returnString += 'Stopped';
      } else {
        return '';
      }
    } else if (build) {
      if (build.failed()) {
        returnString += 'Building Failed';
      } else {
        returnString += 'Building';
      }
    } else {
      return '';
    }
    return returnString;
  };
}
