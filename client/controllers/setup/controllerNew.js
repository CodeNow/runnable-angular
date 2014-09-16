require('app')
  .controller('ControllerNew', ControllerNew);
/**
 * @ngInject
 */
function ControllerNew(
  $scope,
  $state,
  async,
  uuid
) {
  var holdUntilAuth = $scope.UTIL.holdUntilAuth;
  var thisUser;

  function createContext (cb) {
    thisUser = $scope.dataApp.user;
    var context = thisUser.createContext({
      name: uuid.v4()
    }, function (err) {
      cb(err, context);
    });
  }

  function createVersion (context, cb) {
    var version = context.createVersion(function (err) {
      cb(err, context, version);
    });
  }

  function createBuild (context, version, cb) {
    var build = thisUser.createBuild({
      contextVersions: [version.id()]
    }, function (err) {
      cb(err, build);
    });
  }

  async.waterfall([
    holdUntilAuth,
    createContext,
    createVersion,
    createBuild
  ], function (err, build) {
    if (err) {
      throw err;
    }
    $state.go('instance.setup', {
      buildId: build.id()
    });
  });
}