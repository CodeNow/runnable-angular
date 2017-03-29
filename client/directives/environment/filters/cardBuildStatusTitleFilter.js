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
    if (keypather.get(instance, 'isMigrating()')) {
      return 'Migrating Container';
    }
    var status = keypather.get(instance, 'status()');
    var statusMap = {
      stopped: 'Stopped',
      starting: 'Starting',
      stopping: 'Stopping',
      crashed: 'Crashed',
      running: 'Running for',
      buildFailed: 'Failed',
      building: 'Building for',
      neverStarted: 'Failed',
      unknown: 'unknown'
    };

    // We really only care about test containers that have these states
    if (keypather.get(instance, 'attrs.isTesting') && ['crashed', 'stopped', 'running'].includes(status) && !keypather.get(instance, 'attrs.isTestReporter')) {
      statusMap.crashed = 'Test completed';
    }

    if (keypather.get(instance, 'attrs.isTesting') && keypather.get(instance, 'getRepoName()')) {
      statusMap.stopped = 'Passed';
      statusMap.running = 'Testing for';
      statusMap.crashed = 'Failed';
    }

    var time = 0;
    var noAgo = false;

    switch (status) {
      case 'starting':
      case 'stopping':
        return statusMap[status];
      case 'stopped':
      case 'crashed':
        time = keypather.get(instance, 'containers.models[0].attrs.inspect.State.FinishedAt');
        break;
      case 'buildFailed':
      case 'neverStarted':
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
