require('app')
  .directive('accountsSelect', accountsSelect);
/**
 * @ngInject
 */
function accountsSelect(
  async,
  determineActiveAccount,
  $filter,
  $rootScope,
  QueryAssist,
  fetchUser,
  $state,
  user
) {
  return {
    restrict: 'E',
    templateUrl: 'viewAccountsSelect',
    scope: {},
    link: function ($scope, elem, attrs) {

      // outside click, close list
      $scope.$on('app-document-click', function () {
        $scope.isChangeAccount = false;
      });

      // control collapse/expand accounts list
      $scope.isChangeAccount = false;

      $scope.selectActiveAccount = function (userOrOrg) {
        if (!$scope.isChangeAccount) { return; }
        // close list
        $scope.isChangeAccount = false;
        // synchronously display new active account
        $scope.activeAccount = userOrOrg;
        // fetch userOrOrg instances
        // send to first result
        new QueryAssist($scope.user, angular.noop)
          .wrapFunc('fetchInstances')
          .query({
            owner: {
              github: $scope.activeAccount.oauthId()
            }
          })
          .cacheFetch(function (instances, cached, cb) {
            cb();
            $rootScope.safeApply();
          })
          .resolve(function (err, instances, cb) {
            if (userOrOrg !== $scope.activeAccount) { return; }
            instances.models = $filter('orderBy')(instances.models, 'attrs.name');
            if (instances.models.length) {
              $state.go('instance.instance', {
                userName: userOrOrg.oauthName(),
                instanceName: instances.models[0].attrs.name
              });
            } else {
              // send to setup page for creating an instance
              $state.go('instance.new', {
                userName: userOrOrg.oauthName()
              });
            }
            cb();
          })
          .go();
      };

      function fetchOrgs(user, cb) {
        $scope.user = user;
        $scope.orgs = $scope.user.fetchGithubOrgs(function (err) {
          if (err) { throw err; }
          // TODO: heap
          cb();
        });
      }

      async.waterfall([
        determineActiveAccount,
        function (activeAccount, cb) {
          $scope.activeAccount = activeAccount;
          $rootScope.safeApply();
          cb();
        },
        fetchUser,
        fetchOrgs
      ]);

    }
  };
}
