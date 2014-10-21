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

      // outside click, close list
      $scope.$on('app-document-click', function () {
        $scope.isChangeAccount = false;
      });

      // control collapse/expand accounts list
      $scope.isChangeAccount = false;

      var selectInProgress = false;
      $scope.selectActiveAccount = function (userOrOrg) {
        // prevent multiple clicks
        if (selectInProgress) {
          return;
        }
        selectInProgress = true;
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
            selectInProgress = false;
            cb();
          })
          .go();
      };

      function fetchUser (cb) {
        new QueryAssist(user, cb)
          .wrapFunc('fetchUser')
          .query('me')
          .cacheFetch(function (user, cached, cb) {
            $scope.user = user;
            cb();
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

      async.waterfall([
        determineActiveAccount,
        function (activeAccount, cb) {
          $scope.activeAccount = activeAccount;
          $rootScope.safeApply();
        },
        fetchUser,
        fetchOrgs
      ]);

    }
  };
}
