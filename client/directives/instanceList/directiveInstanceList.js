require('app')
  .directive('instanceList', instanceList);
/**
 * @ngInject
 */
function instanceList (
  async,
  determineActiveAccount,
  getInstanceClasses,
  getInstanceAltTitle,
  QueryAssist,
  $rootScope,
  $state,
  user
) {
  return {
    restrict: 'E',
    templateUrl: 'viewInstanceList',
    replace: true,
    scope: {},
    link: function ($scope, elem, attrs) {

      function fetchUser(cb) {
        new QueryAssist(user, cb)
          .wrapFunc('fetchUser')
          .query('me')
          .cacheFetch(function (user, cached, cb) {
            $scope.user = user;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, user, cb) {
            if (err) { throw err; }
          })
          .go();
      }

      function fetchOrgs(cb) {
        $scope.orgs = $scope.user.fetchGithubOrgs(function (err) {
          if (err) { throw err; }
          cb();
        });
      }

      function fetchInstances(cb) {
        async.waterfall([
          determineActiveAccount,
          function (activeAccount, cb) {
            if (activeAccount !== $scope.activeAccount) {
              $scope.activeAccount = activeAccount;
              // Show spinner only if the user changed accounts
              $scope.showSpinner = true;
              $rootScope.safeApply(function () {
                cb();
              });
            }
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
                if ($scope.instances !== instances) {
                  $scope.instances = instances;
                }
                cb();
              })
              .resolve(function (err, projects, cb) {
                cb(err);
              })
              .go();
          }
        ], function (err) {
          if ($scope.showSpinner) {
            $scope.showSpinner = false;
            $rootScope.safeApply();
          }
          if (err) { throw err; }
        });
      }
      function loadUsers(cb) {
        $scope.loadingUsers = true;
        $rootScope.safeApply();
        async.series([
          fetchUser,
          fetchOrgs,
          function (cb) {
            $scope.loadingUsers = false;
            $rootScope.safeApply(function () {
              cb();
            });
          }
        ], cb);
      }

      /**
       * Refetch list of instances on state changes.
       * Useful after delete, fork, copy
       */
      $scope.$on('$locationChangeSuccess', fetchInstances);

      $scope.stateToNew = function () {
        $state.go('instance.new', {
          userName: $scope.activeAccount.oauthId()
        });
      };

      $scope.stateToInstance = function (instance) {
        $state.go('instance.instance', {
          instanceName: instance.attrs.name,
          userName: instance.attrs.owner.username
        });
      };

      $scope.getInstanceClasses = getInstanceClasses;

      $scope.getInstanceAltTitle = getInstanceAltTitle;

      loadUsers(fetchInstances);
    }
  };
}
