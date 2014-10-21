require('app')
  .directive('runnableSetupPrimaryActions', RunnableSetupPrimaryActions);
/**
 * @njInject
 */
function RunnableSetupPrimaryActions (
  async,
  determineActiveAccount,
  QueryAssist,
  $rootScope,
  user
) {
  return {
    restrict: 'E',
    templateUrl: 'viewSetupPrimaryActions',
    replace: true,
    scope: {
      build: '=',
      loading: '=',
      name: '=',
      valid: '='
    },
    link: function ($scope, elem, attrs) {

      function updateInstancesCollection () {
      }

      function goToBuild () {
      }

      $scope.buildAndAttach = function () {
        $scope.loading = true;
        function build (cb) {
          $scope.build.build({
            message: 'Initial Build'
          }, cb);
        }
        function attach (cb) {
          var instance = $scope.user.createInstance({
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
          updateInstancesCollection();
          goToBuild();
        });
      };

      function fetchUser (cb) {
        new QueryAssist(user, cb)
          .wrapFunc('fetchUser')
          .query('me')
          .cacheFetch(function (user, cached, cb) {
            $scope.user = user;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, user, cb) {
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
        fetchUser
      ]);

    }
  };
}
