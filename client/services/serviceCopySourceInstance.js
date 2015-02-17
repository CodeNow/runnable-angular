'use strict';

require('app')
  .factory('copySourceInstance', copySourceInstance);

function copySourceInstance(
  pFetchUser,
  promisify,
  createNewInstance
) {
  return function (activeAccount, instance, opts) {
    var thisUser;
    return pFetchUser().then(function copyContextVersion(user) {
      thisUser = user;
      return promisify(instance.contextVersion, 'deepCopy')({
        owner: {
          github: activeAccount.oauthId()
        }
      });
    }).then(function createBuild(version) {
      return promisify(thisUser, 'createBuild')({
        contextVersions: [version.id()],
        owner: {
          github: activeAccount.oauthId()
        }
      });
    }).then(function (build) {
      return createNewInstance(activeAccount, build, opts);
    });
  };
}
