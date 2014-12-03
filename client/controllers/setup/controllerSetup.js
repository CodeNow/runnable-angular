require('app')
  .controller('ControllerSetup', ControllerSetup);
/**
 * ControllerSetup
 * @param $scope
 * @constructor
 * @export
 * @ngInject
 */
function ControllerSetup(
  async,
  determineActiveAccount,
  $scope,
  $state,
  $stateParams,
  keypather,
  OpenItems,
  user,
  QueryAssist,
  $window
) {

  var dataSetup = $scope.dataSetup = {
    data: {
      instanceOpts: {}
    },
    actions: {}
  };
  var data = dataSetup.data;

  dataSetup.actions.olarkShrink = function() {
    if (angular.isFunction($window.olark)) {
      $window.olark('api.box.shrink');
    }
  };

  $scope.$watch('dataSetup.data.build.contextVersions.models[0].source', function(n, p) {
    if (n && dataSetup.data.showVideo) {
      dataSetup.data.showVideoFixed = true;
    }
    if (n && !p && data.showVideo) {
      // first time user has selected a seed dockerfile, minimize olark if video is playing
      //
      dataSetup.actions.olarkShrink();
    }
  });

  data.openItems = new OpenItems();
  data.showExplorer = false;
  data.loading = false;

  // Redirect to /new if this build has already been built
  function fetchUser(cb) {
    new QueryAssist(user, cb)
      .wrapFunc('fetchUser')
      .query('me')
      .cacheFetch(function (user, cached, cb) {
        data.user = user;
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, user, cb) {
        if (err) { throw err; }
      })
      .go();
  }

  function fetchBuild(cb) {
    new QueryAssist(data.user, cb)
      .wrapFunc('fetchBuild')
      .query($stateParams.buildId)
      .cacheFetch(function (build, cached, cb) {
        if (keypather.get(build, 'attrs.started')) {
          // this build has been built.
          // redirect to new?
          $state.go('instance.new', {
            userName: $scope.activeAccount.oauthId()
          });
          cb(new Error('build already built'));
        } else {
          data.build = build;
          $scope.safeApply();
          cb();
        }
      })
      .resolve(function (err, build, cb) {
        if (err) { throw err; }
      })
      .go();
  }

  function fetchInstances(cb) {
    new QueryAssist(data.user, cb)
      .wrapFunc('fetchInstances', cb)
      .query({
        githubUsername: $stateParams.userName
      })
      .cacheFetch(function (instances, cached, cb) {
        if (!cached && instances.models.length === 0) {
          throw new Error('instance not found');
        }
        data.instances = instances;
        $scope.safeApply();
        cb();
      })
      .resolve(function (err) {
        if (err) { throw err; }
      })
      .go();
  }

  async.waterfall([
    determineActiveAccount,
    function (activeAccount, cb) {
      $scope.activeAccount = activeAccount;
      $scope.safeApply();
      cb();
    },
    fetchUser,
    fetchBuild,
    fetchInstances
  ]);

}
