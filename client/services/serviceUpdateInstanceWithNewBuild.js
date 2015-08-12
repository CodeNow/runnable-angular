'use strict';

require('app')
  .factory('updateInstanceWithNewBuild', updateInstanceWithNewBuild);


require('app')
  .factory('updateInstanceWithNewAcvData', updateInstanceWithNewAcvData);

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

/**
 * Updates the given build with new data, builds it, then updates the given instance with this
 * new build
 * @returns {Function}
 */
function updateInstanceWithNewAcvData(
  $state,
  $q,
  errs,
  eventTracking,
  hasKeypaths,
  keypather,
  promisify
) {
  return function (instance, acv, repoObject) {
    /*
     1. Clone the build
     2. Fetch the context version
     3. Find the matching ACV and update it in the new context version
     4. Build the build
     5. Update instance w/ Build
     */
    eventTracking.toggledCommit({triggeredBuild: true});
    return promisify(instance.build, 'deepCopy')() // 1. Clone the build
      .then(function (build) {
        // Nested because we need the build var lower down the chain
        return promisify(build.contextVersions.models[0], 'fetch')() // 2. Fetch context version
          .then(function (contextVersion) {
            // 3. Find matching ACV
            var mainAcv = contextVersion.appCodeVersions.models.find(function (newAcv) {
              return newAcv.attrs.branch === acv.attrs.branch && newAcv.attrs.commit === acv.attrs.commit;
            });
            return promisify(mainAcv, 'update')({
              branch: repoObject.branch.attrs.name,
              commit: repoObject.commit.sha
            }); // Update ACV
          })
          .then(function () {
            return promisify(build, 'build')({ // 4. Build the build
              message: 'Update application code version(s)'
            });
          });
      })
      .then(function (updatedBuild) { // 5. Update instance w/ Build
        return promisify(instance, 'update')({
          build: updatedBuild.id()
        });
      })
      .catch(errs.handler);
  };
}
