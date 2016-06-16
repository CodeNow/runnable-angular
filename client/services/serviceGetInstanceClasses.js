'use strict';

require('app')
  .factory('getInstanceClasses', getInstanceClasses);

function getInstanceClasses(
  $state,
  keypather
) {
  return function (instance) {
    if (!instance) {
      return {}; //async loading handling
    }
    if (keypather.get(instance, 'isMigrating()')) {
      return 'orange';
    }
    var h = {};
    h.active = (keypather.get(instance, 'attrs.name') === $state.params.instanceName);

    var status = keypather.get(instance, 'status()');
    var statusMap = {
      'stopped': '',
      'crashed': 'red',
      'running': 'green',
      'buildFailed': 'red',
      'building': 'orange',
      'neverStarted': 'red',
      'unknown': '',
      'starting': 'orange',
      'stopping': 'green'
    };

    var testingStatusMap = {
      stopped: 'passed',
      crashed: 'failed',
      running: 'orange'
    };

    if (keypather.get(instance, 'attrs.isTesting') && testingStatusMap[status]) {
      h[testingStatusMap[status]] = true;
    } else {
      h[statusMap[status]] = true;
    }

    return h;
  };
}
