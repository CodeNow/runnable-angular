require('app')
  .directive('runnableSetupBoxName', RunnableSetupBoxName);
/**
 * @ngInject
 */
function RunnableSetupBoxName (
  async,
  determineActiveAccount,
  keypather,
  QueryAssist,
  $rootScope,
  user
) {
  return {
    restrict: 'E',
    templateUrl: 'viewSetupBoxName',
    replace: true,
    scope: {
      newInstanceName: '=name',
      valid: '='
    },
    link: function ($scope, elem, attrs) {

      $scope.newInstanceName = '';

      $scope.$watch('newInstanceNameForm.$valid', function () {
        $scope.valid = arguments[0];
      });

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

      function fetchInstances (cb) {
        determineActiveAccount(function (activeAccount) {
          $scope.activeAccount = activeAccount;
          new QueryAssist($scope.user, cb)
            .wrapFunc('fetchInstances', cb)
            .query({
              owner: {
                github: $scope.activeAccount.oauthId()
              }
            })
            .cacheFetch(function (instances, cached, cb) {
              $scope.instances = instances;
              $rootScope.safeApply();
              cb();
            })
            .resolve(function (err, projects, cb) {
            })
            .go();
        });
      }

      async.series([
        fetchUser,
        fetchInstances
      ]);
    }
  };
}
