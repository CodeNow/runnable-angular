'use strict';

require('app')
  .factory('createNewBuild', createNewBuild);

function createNewBuild(
  fetchUser,
  promisify,
  $q,
  uuid
) {
  return function (activeAccount, context, infraCodeVersionId, appCodeVersions) {
    var thisUser, version;
    function createContext(user) {
      return promisify(user, 'createContext')({
        name: uuid.v4(),
        owner: {
          github: activeAccount.oauthId()
        }
      });
    }

    function createVersion(context) {
      var body = infraCodeVersionId ? {
        infraCodeVersion: infraCodeVersionId
      } : {};
      return promisify(context, 'createVersion')(body)
        .then(function (newContextVersion) {
          version = newContextVersion;
          if (appCodeVersions) {
            return $q.all(appCodeVersions.map(function (acvState) {
              return promisify(version.appCodeVersions, 'create')(acvState);
            }));
          }
          return version;
        });
    }

    function createBuild() {
      return promisify(thisUser, 'createBuild')({
        contextVersions: [version.id()],
        owner: {
          github: activeAccount.oauthId()
        }
      })
        .then(function (build) {
          // This is needed for part of GS
          build.contextVersion = version;
          return build;
        });
    }

    return fetchUser()
      .then(function (user) {
        thisUser = user;
        return context || createContext(user);
      })
      .then(createVersion)
      .then(createBuild);

  };
}
