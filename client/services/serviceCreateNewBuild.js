'use strict';

require('app')
  .factory('createNewBuild', createNewBuild);

function createNewBuild(
  async,
  fetchUser,
  uuid
) {
  return function (activeAccount, appCodeVersions, cb) {
    if (typeof appCodeVersions === 'function') {
      cb = appCodeVersions;
      appCodeVersions = null;
    }
    function createContext(user, cb) {
      var context = user.createContext({
        name: uuid.v4(),
        owner: {
          github: activeAccount.oauthId()
        }
      }, function (err) {
        cb(err, user, context);
      });
    }

    function createVersion(user, context, cb) {
      var version = context.createVersion(function (err) {
        if (appCodeVersions) {
          async.each(appCodeVersions, function (acvState, cb) {
            version.appCodeVersions.create(acvState, cb);
          }, function (err) {
            cb(err, user, context, version);
          });
        } else {
          cb(err, user, context, version);
        }
      });
    }

    function createBuild(user, context, version, cb) {
      var build = user.createBuild({
        contextVersions: [version.id()],
        owner: {
          github: activeAccount.oauthId()
        }
      }, function (err) {
        cb(err, build, version);
      });
    }

    async.waterfall([
      fetchUser,
      createContext,
      createVersion,
      createBuild
    ], cb);
  };
}
