require('app')
  .factory('createNewBuild', createNewBuild);

function createNewBuild(
  async,
  fetchUser,
  uuid
) {
  return function (activeAccount, cb) {
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
        cb(err, user, context, version);
      });
    }

    function createBuild(user, context, version, cb) {
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
      createContext,
      createVersion,
      createBuild
    ], cb);
  };
}
