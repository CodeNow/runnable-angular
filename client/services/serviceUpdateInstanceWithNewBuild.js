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
  return function (instance, build, noCache) {
    eventTracking.triggeredBuild(false);
    return promisify(build, 'build')({
      message: 'manual',
      noCache: noCache
    })
      .then(function (build) {
        return promisify(instance, 'update')({
          build: build.id()
        });
      });
  };
}
