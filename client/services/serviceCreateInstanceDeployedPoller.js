'use strict';

require('app')
  .factory('createInstanceDeployedPoller', createInstanceDeployedPoller);
/**
 * @ngInject
 */
function createInstanceDeployedPoller (
  errs,
  keypather,
  $rootScope,
  $interval
) {
  /**
   * If instance is not yet deployed, Polls server
   * requesting instance model until response indicates
   * instance has been deployed.
   */
  function InstanceDeployedPoller (instance) {
    this.instance = instance;
    this.pollingStarted = false;
    this.startCounter = 0;
  }

  InstanceDeployedPoller.prototype.start = function () {
    var instance = this.instance;

    if (keypather.get(instance, 'build.failed()') ||
        (keypather.get(instance, 'build.succeeded()') &&
         keypather.get(instance, 'containers.models[0]'))) {
      return;
    }

    this.startCounter++;
    // one polling operation per unique instance
    if (this.pollingStarted) { return; }
    this.pollingStarted = true;

    var self = this;
    var intervalCount = 0;
    this.interval = $interval(function () {
      if (intervalCount > 100) { return self.clear(true); } // limit 100 attempts
      intervalCount++;

      instance.deployed(function (err, deployed) {
        if (err) { return console.log(err); }
        if (deployed) { self.clear(true); }
      });
    }, 400);
    return this;
  };

  InstanceDeployedPoller.prototype.clear = function (force) {
    if (force) {
      clear.call(this);
      this.startCounter = 0;
      this.pollingStarted = false;
      return this;
    }
    this.startCounter--;
    if (this.startCounter < 1) { clear.call(this); }
    function clear() {
      /* jshint validthis:true */
      if (this.interval && this.instance) {
        $interval.cancel(this.interval);
        this.instance.fetch(errs.handler);
      }
    }
    return this;
  };

  /**
   * Return single instance of poller class per distinct instance
   */
  var instancePollers = {};
  return function createInstanceDeployedPoller (instance) {
    instancePollers[instance.id()] = instancePollers[instance.id()] ||
      new InstanceDeployedPoller(instance);
    return instancePollers[instance.id()];
  };
}
