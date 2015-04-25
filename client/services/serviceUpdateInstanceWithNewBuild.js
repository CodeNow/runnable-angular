'use strict';

require('app')
  .factory('updateInstanceWithNewBuild', updateInstanceWithNewBuild);

/**
 * Updates the given build with new data, builds it, then updates the given instance with this
 * new build
 * @returns {Function}
 */
function updateInstanceWithNewBuild(
  $state,
  $timeout,
  $q,
  eventTracking,
  promisify
) {
  return function (instance, build, buildObj, instanceUpdateOpts, spinnerParent, actions) {
    var opts = {};
    if (instanceUpdateOpts.env) {
      opts.env = instanceUpdateOpts.env;
    }
    if (instanceUpdateOpts.name && instanceUpdateOpts.name !== instance.attrs.name) {
      opts.name = instanceUpdateOpts.name;
    }
    eventTracking.triggeredBuild(false);
    return promisify(build, 'build')(buildObj)
      .then(function (build) {
        opts.build = build.id();
        return promisify(instance, 'update')(opts);
      }).then(function () {
        if (spinnerParent) {
          spinnerParent.building = false;
        }
        if (actions) {
          var defer = $q.defer();
          actions.close(function () {
            defer.resolve();
          });
          return defer.promise;
        }
      })
      .then(function () {
        if (opts.name) {
          // We need a timeout so the modal has enough time to destroy itself before
          // we reroute
          $timeout(function () {
            return $state.go('instance.instance', {
              instanceName: opts.name
            });
          });
        }
      });
  };
}
