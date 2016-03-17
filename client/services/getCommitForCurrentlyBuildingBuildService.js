'use strict';

require('app')
  .factory('getUncompleteBuidldsForInstanceBranch', getUncompleteBuidldsForInstanceBranch)
  .factory('getCommitForCurrentlyBuildingBuild', getCommitForCurrentlyBuildingBuild);

/**
 * Get the build and commit for all builds in a branch that are currently `building`
 *
 * @param {Object} instance - An instance model
 * @param {Object} instance.attrs.contextVersion.context - ID for context
 * @param {String} branchName - Name of repo branch in GitHub
 * @resolves {Array} Builds - Array of builds objects
 * @returns {Promise}
 */
function getUncompleteBuidldsForInstanceBranch (
  fetchUser,
  keypather,
  promisify
) {
  return function (instance, branchName) {
    return fetchUser()
      .then(function (user) {
        return promisify(user, 'fetchContext')(keypather.get(instance, 'attrs.contextVersion.context'));
      })
      .then(function (context) {
        return promisify(context, 'fetchVersions')( {
          build: {
            completed: false,
            started: true,
            triggeredAction: {
              manual: false
            }
          },
          repo: keypather.get(instance, 'contextVersion.attrs.appCodeVersions[0].repo'),
          branch: branchName,
          limit: 1,
          sort: '-created',
        });
      })
      .then(function (contextVersionCollection) {
        console.log('contextVersionCollection', contextVersionCollection);
        console.log('commit', contextVersionCollection.models.map(function (model) {
          return model.attrs.appCodeVersions[0].commit;
        }));
        return contextVersionCollection
          .map(function (contextVersion) {
            return {
              created: contextVersion.attrs.created,
              build: contextVersion.attrs.build,
              commit: keypather.get(contextVersion, 'attrs.appCodeVersions[0].commit')
            };
          });
      });
  };
}


/**
 * Get the commit hash for the latest currently running (not completed) build
 * Function returns false if not commit is currently building
 *
 * @param {Object} instance - An instance model
 * @resolves {String, Boolean} commitHash - Commit hash (or `false`) of the currently building commit
 * @returns {Promise}
 */
function getCommitForCurrentlyBuildingBuild (
  $q,
  fetchCommitData,
  getUncompleteBuidldsForInstanceBranch,
  keypather
) {
  return function (instance) {
    var contextVersion = keypather.get(instance, 'attrs.contextVersion');
    var currentBuild = keypather.get(contextVersion, 'build');
    var acv = keypather.get(contextVersion, 'appCodeVersions[0]');
    var branchName = keypather.get(acv, 'branch');
    var isLocked = keypather.get(instance, 'attrs.locked');
    if (!isLocked && acv && branchName) {
      return getUncompleteBuidldsForInstanceBranch(instance, branchName)
        .then(function (res) {
          console.log('res', res.length, res);
          if (res.length > 0 && res[0].build.started > currentBuild.started) {
            return fetchCommitData.activeCommit(
              instance.contextVersion.getMainAppCodeVersion(),
              res[0].commit
            );
          }
          return false;
        });
    }
    return $q.resolve(false);
  };
}
