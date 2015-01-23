'use strict';

require('app')
  .factory('copySourceInstance', copySourceInstance);

function copySourceInstance(
  async,
  fetchUser,
  createNewInstance
) {
  return function (activeAccount, instance, opts, instances, cb) {
    function copyContextVersion(user, cb) {
      var newContextVersion = instance.contextVersion.deepCopy({
        owner: {
          github: activeAccount.oauthId()
        }
      }, function (err) {
        cb(err, user, newContextVersion);
      });
    }

    function createBuild(user, version, cb) {
      var build = user.createBuild({
        contextVersions: [version.id()],
        owner: {
          github: activeAccount.oauthId()
        }
      }, function (err) {
        cb(err, build);
      });
    }

    async.waterfall([
      fetchUser,
      copyContextVersion,
      createBuild,
      createNewInstance(activeAccount, null, opts, instances)
    ], cb);
  };
}
