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
  keypather,
  $q,
  eventTracking,
  promisify
) {
  return function (instance, build, noCache, instanceUpdateOpts) {
    var opts = {};
    if (keypather.get(instanceUpdateOpts, 'env')) {
      opts.env = instanceUpdateOpts.env;
    }
    if (keypather.get(instanceUpdateOpts, 'name') &&
        instanceUpdateOpts.name !== instance.attrs.name) {
      opts.name = instanceUpdateOpts.name;
    }
    eventTracking.triggeredBuild(false);
    return promisify(build, 'build')({
      message: 'Manual build',
      noCache: !!noCache
    })
      .then(function (build) {
        opts.build = build.id();
        return promisify(instance, 'update')(opts);
      });
  };
}
