require('app')
  .factory('helperFetchInstanceDeployStatus', helperFetchInstanceDeployStatus);
/**
 * @ngInject
 */
function helperFetchInstanceDeployStatus (
  $rootScope,
  $timeout
) {
  /**
   * If instance is not yet deployed, Polls server
   * requesting instance model until response indicates
   * instance has been deployed.
   */
  return function fetchInstanceDeployStatus(instance, cb) {
    checkDeployed();
    function checkDeployed () {
      instance.deployed(function (err, isDeployed) {
        if (!isDeployed) {
          return $timeout(pollFetchContainer, 200);
        }
        /**
         * Fetch 1 more time, 1st instance fetch may have returned result
         * with 0 containers. Another fetch necessary to update model
         */
        instance.fetch(function () {
          $rootScope.safeApply();
        });
        $rootScope.safeApply();
        cb(null, instance);
      });
    }
    function pollFetchContainer() {
      instance.fetch(function () {
        checkDeployed();
      });
    }
  };
}
