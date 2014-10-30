require('app')
  .controller('ControllerNew', ControllerNew);
/**
 * @ngInject
 */
function ControllerNew(
  async,
  hasKeypaths,
  QueryAssist,
  $scope,
  $state,
  uuid,
  user
) {

  var thisUser;
  var owner;

  $scope.dataApp.data.loading = true;

  function fetchUser(cb) {
    new QueryAssist(user, cb)
      .wrapFunc('fetchUser')
      .query('me')
      .cacheFetch(function (user, cached, cb) {
        $scope.user = user;
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, user, cb) {})
      .go();
  }

  function setOwner(cb) {
    var currentUserOrOrgName = $state.params.userName;
    thisUser = $scope.user;

    if (!currentUserOrOrgName || currentUserOrOrgName === $scope.user.oauthName()) {
      owner = $scope.user;
      return cb();
    }
    var orgs = thisUser.fetchGithubOrgs(function (err) {
      $scope.safeApply();
      cb(err);
      var currentOrg = orgs.find(hasKeypaths({
        'attrs.login.toLowerCase()': currentUserOrOrgName.toLowerCase()
      }));
      if (currentOrg) {
        owner = currentOrg;
        return cb();
      }
      return cb(new Error('User or Org not found'));
    });
  }

  function createContext(cb) {
    var context = thisUser.createContext({
      name: uuid.v4(),
      owner: {
        github: owner.oauthId()
      }
    }, function (err) {
      cb(err, context);
    });
  }

  function createVersion(context, cb) {
    var version = context.createVersion(function (err) {
      cb(err, context, version);
    });
  }

  function createBuild(context, version, cb) {
    var build = thisUser.createBuild({
      contextVersions: [version.id()],
      owner: {
        github: owner.oauthId()
      }
    }, function (err) {
      cb(err, build);
    });
  }

  async.waterfall([
    fetchUser,
    setOwner,
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
