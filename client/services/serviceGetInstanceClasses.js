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
    var instanceClasses = {};
    instanceClasses.active = (keypather.get(instance, 'attrs.name') === $state.params.instanceName);

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

    var testReporterStatusMap = {
      stopped: 'passed',
      crashed: 'failed',
      running: 'orange'
    };

    if (keypather.get(instance, 'attrs.isTesting') && keypather.get(instance, 'attrs.isTestReporter') && testReporterStatusMap[status]) {
      instanceClasses[testReporterStatusMap[status]] = true;
      return instanceClasses;
    }

    // We really only care about containers that have these states
    if (keypather.get(instance, 'attrs.isTesting') && ['crashed', 'stopped', 'running'].includes(status)) {
      // We are a testing container, but we aren't the reporter. Fetch the reporter from my isolation.
      if (instance.isolation) {
        var testReporter;
        if (keypather.get(instance, 'isolation.groupMaster.attrs.isTestReporter')) {
          testReporter = instance.isolation.groupMaster;
        } else if (instance.isolation.instances) {
          testReporter = instance.isolation.instances.find(function (instance) {
            return keypather.get(instance, 'attrs.isTestReporter');
          });
        }
        // We didn't find a test reporter, that's weird. The isolation probably hasn't finished loading yet.
        if (!testReporter) {
          return instanceClasses;
        }
        /* Did the container stop based on our doing or did it happen while tests were running?
           To answer this question we compare our stop times, if we died before the reporter did it died during tests
           Otherwise it died afterwards because we triggered it to be killed.
         */
        var ourFinishDate = keypather.get(instance, 'attrs.container.inspect.State.FinishedAt');
        var testReporterFinishDate = keypather.get(testReporter, 'attrs.container.inspect.State.FinishedAt');
        if (ourFinishDate > testReporterFinishDate) {
          instanceClasses.completed = true;
          return instanceClasses;
        }

      } else {
        // Legacy test container
        instanceClasses[testReporterStatusMap[status]] = true;
        return instanceClasses;
      }
    }

    instanceClasses[statusMap[status]] = true;
    return instanceClasses;
  };
}
