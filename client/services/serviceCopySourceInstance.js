'use strict';

require('app')
  .factory('copySourceInstance', copySourceInstance);

function copySourceInstance(
  fetchUser,
  promisify,
  createNewInstance
) {
  return function (activeAccount, sourceInstance) {
    var thisUser;
    return fetchUser().then(function copyContextVersion(user) {
      thisUser = user;
      return promisify(sourceInstance.contextVersion, 'deepCopy')({
        owner: {
          github: activeAccount.oauthId()
        }
      });
    })
      .then(function (version) {
        return promisify(version, 'update')({
          advanced: true
        });
      })
      .then(function createBuild(version) {
        return promisify(thisUser, 'createBuild')({
          contextVersions: [version.id()],
          owner: {
            github: activeAccount.oauthId()
          }
        });
      });
  };
}
