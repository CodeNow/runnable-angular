'use strict';

require('app')
  .factory('createBuildFromContextVersionId', createBuildFromContextVersionId);

/**
 * Create and return a build from a context version id
 *
 * @param {Number} - ID of the context version, based on `id()` method
 * @return {Promise} - Promise that returns a build
 */
function createBuildFromContextVersionId(
  $rootScope,
  fetchUser,
  promisify
) {
  return function (contextVersionId) {
    return fetchUser()
      .then(function (user) {
        return promisify(user, 'createBuild')({
          contextVersions: [contextVersionId],
          owner: {
            github: $rootScope.dataApp.data.activeAccount.oauthId()
          }
        });
      });
  };
}
