'use strict';

require('app')
  .filter('cardBuildStatusTitle', cardBuildStatusTitle);
/**
 * @ngInject
 */
function cardBuildStatusTitle(
  keypather,
  moment
) {
  return function (instance) {
    var container = keypather.get(instance, 'containers.models[0]');
    var build = keypather.get(instance, 'build');
    var time = 0;
    var prefix = '';
    var noAgo = false;
    if (container) {
      if (container.running()) {
        prefix = 'Running for';
        noAgo = true;
        time = keypather.get(container, 'attrs.inspect.State.StartedAt');
      } else {
        if (keypather.get(container, 'attrs.inspect.State.ExitCode') === -1) {
          // -1 means a user killed it
          prefix = 'Stopped';
        } else {
          prefix = 'Crashed';
        }
        time = keypather.get(container, 'attrs.inspect.State.FinishedAt');
      }
    } else if (build) {
      if (build.failed()) {
        prefix = 'Failed';
        time = keypather.get(build, 'attrs.completed');
      } else {
        noAgo = true;
        prefix = 'Building for';
        time = keypather.get(build, 'attrs.started');
      }
    }
    return prefix + ' ' + moment(time).fromNow(noAgo);
  };
}
