require('app')
  .directive('runnableAccountsSelect', RunnableAccountsSelect);
/**
 * @ngInject
 */
function RunnableAccountsSelect (
  async,
  determineActiveAccount,
  $rootScope,
  QueryAssist,
  $state,
  user
) {
  return {
    restrict: 'E',
    templateUrl: 'viewAccountsSelect',
    replace: true,
    scope: {},
    link: function ($scope, elem, attrs) {

      $scope.isChangeAccount = false;

      $scope.selectActiveAccount = function (userOrOrg) {};

      determineActiveAccount(function (err, activeAccount) {
        $scope.activeAccount = activeAccount;
        $rootScope.safeApply();
      });

      function fetchUser (cb) {
        new QueryAssist(user, cb)
          .wrapFunc('fetchUser')
          .query('me')
          .cacheFetch(function (user, cached, cb) {
            $scope.user = user;
          })
          .resolve(function (err, user, cb) {
          })
          .go();
      }

      function fetchOrgs (cb) {
        $scope.orgs = $scope.user.fetchGithubOrgs(function (err) {
          if (err) throw err;
          // TODO: heap
          cb();
        });
      }

      async.series([
        fetchUser,
        fetchOrgs
      ]);

    }
  };
}
