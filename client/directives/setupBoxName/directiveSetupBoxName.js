require('app')
  .directive('setupBoxName', setupBoxName);
/**
 * @ngInject
 */
function setupBoxName(
  async,
  determineActiveAccount,
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

      function fetchInstances(cb) {
        async.waterfall([
          determineActiveAccount,
          function (activeAccount, cb) {
            $scope.activeAccount = activeAccount;
            $rootScope.safeApply();
            cb();
          },
          function (cb) {
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
                if (err) throw err;
              })
              .go();
          }
        ]);
      }

      async.series([
        fetchUser,
        fetchInstances
      ]);
    }
  };
}
