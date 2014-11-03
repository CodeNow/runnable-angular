require('app')
  .directive('runnableSetupPrimaryActions', RunnableSetupPrimaryActions);
/**
 * @njInject
 */
function RunnableSetupPrimaryActions(
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
      valid: '='
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
          $scope.build.build({
            message: 'Initial Build'
          }, cb);
        }

        function attach(cb) {
          $scope.instance = $scope.user.createInstance({
            owner: {
              github: $scope.activeAccount.oauthId()
            },
            build: $scope.build.id(),
            name: $scope.name
          }, cb);
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

      async.waterfall([
        determineActiveAccount,
        function (activeAccount, cb) {
          $scope.activeAccount = activeAccount;
          $rootScope.safeApply();
          cb();
        },
        fetchUser,
        fetchBuild
      ]);

    }
  };
}
