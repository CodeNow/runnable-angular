require('app')
  .factory('createInstanceDeployedPoller', createInstanceDeployedPoller);
/**
 * @ngInject
 */
function createInstanceDeployedPoller (
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
  }
  InstanceDeployedPoller.prototype.start = function () {
    var instance = this.instance;
    if (!instance || !instance.build || instance.build.succeeded()) { // only poll container if build is done..
      return;
    }
    var self = this;
    this.interval = $interval(function () {
      instance.deployed(function (err, deployed) {
        if (err) { return console.log(err); }
        if (deployed) {
          self.clear();
        }
      });
    }, 200);
    return this;
  };
  InstanceDeployedPoller.prototype.clear = function () {
    if (this.interval && this.instance) {
      $interval.clear(this.interval);
      this.instance.fetch(function () {
        $rootScope.safeApply();
      });
    }
    return this;
  };

  return function createInstanceDeployedPoller (instance) {
    return new InstanceDeployedPoller(instance);
  };
}
