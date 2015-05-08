'use strict';

require('app')
  .filter('cardBuildStatusTitle', cardBuildStatusTitle);
/**
 * @ngInject
 */
function cardBuildStatusTitle(
  keypather,
  moment,
  instanceStatus
) {
  return function (instance) {
    var status = instanceStatus(instance);
    var statusMap = {
      'stopped': 'Stopped',
      'crashed': 'Crashed',
      'running': 'Running for',
      'buildFailed': 'Failed',
      'building': 'Building for',
      'unknown': 'unknown'
    };

    var time = 0;
    var noAgo = false;

    switch (status) {
      case 'stopped':
      case 'crashed':
        time = keypather.get(instance, 'containers.models[0].attrs.inspect.State.FinishedAt');
        break;
      case 'buildFailed':
        time = keypather.get(instance, 'build.attrs.completed');
        break;
      case 'building':
        noAgo = true;
        time = keypather.get(instance, 'build.attrs.started');
        break;
      case 'running':
        noAgo = true;
        time = keypather.get(instance, 'containers.models[0].attrs.inspect.State.StartedAt');
        break;
      default:
        return 'Processing';
    }

    return statusMap[status] + ' ' + moment(time).fromNow(noAgo);
  };
}
