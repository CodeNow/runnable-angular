require('app')
  .directive('setupPrimaryActions', setupPrimaryActions);
/**
 * @njInject
 */
function setupPrimaryActions(
  async,
  determineActiveAccount,
  QueryAssist,
  $rootScope,
  $state,
  $stateParams,
  user
) {
  return {
    restrict: 'E',
    templateUrl: 'viewSetupPrimaryActions',
    replace: true,
    scope: {
      loading: '=',
      name: '=',
      valid: '=',
      openItems: '=',
      instanceOpts: '='
    },
    link: function ($scope, elem, attrs) {

      function goToInstance() {
        $state.go('instance.instance', {
          // TODO: replace w/
          // userName: $scope.instance.attrs.owner.username,
          userName: $scope.activeAccount.oauthName(),
          instanceName: $scope.instance.attrs.name
        });
      }

      $scope.buildAndAttach = function () {
        $scope.loading = true;

        function build(cb) {
          var unwatch = $scope.$watch('openItems.isClean()', function (n) {
            if (!n) { return; }
            unwatch();
            $scope.build.build({
              message: 'Initial Build'
            }, cb);
          });
        }

        function attach(cb) {
          $scope.instanceOpts.owner = {
            github: $scope.activeAccount.oauthId()
          };
          $scope.instanceOpts.build = $scope.build.id();
          $scope.instanceOpts.name = $scope.name;
          $scope.instance = $scope.user.createInstance($scope.instanceOpts, cb);
        }
        async.series([
          build,
          attach
        ], function (err) {
          if (err) throw err;
          $scope.loading = false;
          goToInstance();
        });
      };

      function fetchUser(cb) {
        new QueryAssist(user, cb)
          .wrapFunc('fetchUser')
          .query('me')
          .cacheFetch(function (user, cached, cb) {
            $scope.user = user;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, user, cb) {})
          .go();
      }

      function fetchBuild(cb) {
        new QueryAssist($scope.user, cb)
          .wrapFunc('fetchBuild')
          .query($stateParams.buildId)
          .cacheFetch(function (build, cached, cb) {
            $scope.build = build;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, build, cb) {
            if (err) throw err;
            $rootScope.safeApply();
            cb();
          })
          .go();
      }

      function fetchInstances(cb) {
        new QueryAssist($scope.user, cb)
          .wrapFunc('fetchInstances', cb)
          .query({
            githubUsername: $stateParams.userName
          })
          .cacheFetch(function (instances, cached, cb) {
            if (!cached && instances.models.length === 0) {
              throw new Error('instance not found');
            }
            $scope.instances = instances;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err) {
            if (err) { }
          })
          .go();
      }

      async.waterfall([
        determineActiveAccount,
        function (activeAccount, cb) {
          $scope.activeAccount = activeAccount;
          $rootScope.safeApply();
          cb();
        },
        fetchUser,
        fetchBuild,
        fetchInstances
      ]);

    }
  };
}
