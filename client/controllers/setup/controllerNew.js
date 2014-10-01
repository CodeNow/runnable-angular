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

  $scope.dataApp.data.loading = true;

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
      contextVersions: [version.id()],
      owner: {
        github: $scope.dataInstanceLayout.data.activeAccount.oauthId()
      }
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
    $scope.dataApp.data.loading = false;
    if (err) {
      throw err;
    }
    $state.go('instance.setup', {
      userName: $state.params.userName,
      buildId: build.id()
    });
  });
}