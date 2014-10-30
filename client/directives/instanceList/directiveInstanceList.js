require('app')
  .directive('runnableInstanceList', RunnableInstanceList);
/**
 * @ngInject
 */
function RunnableInstanceList(
  async,
  determineActiveAccount,
  $filter,
  getInstanceClasses,
  getInstanceAltTitle,
  QueryAssist,
  $rootScope,
  $state,
  user,
  keypather
) {
  return {
    restrict: 'E',
    templateUrl: 'viewInstanceList',
    replace: true,
    scope: {},
    link: function ($scope, elem, attrs) {

      /**
       * Refetch list of instances on state changes.
       * Useful after delete, fork, copy
       */
      $scope.$on('$locationChangeSuccess', function () {
        async.series([
          fetchUser,
          fetchOrgs,
          fetchInstances
        ]);
      });

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
            if (err) throw err;
          })
          .go();
      }

      function fetchOrgs(cb) {
        $scope.orgs = $scope.user.fetchGithubOrgs(function (err) {
          if (err) throw err;
          cb();
        });
      }

      function fetchInstances(cb) {
        async.waterfall([
          determineActiveAccount,
          function (activeAccount, cb) {
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
              .resolve(function (err, projects, cb) {})
              .go();
          }
        ]);
      }

      async.series([
        fetchUser,
        fetchOrgs,
        fetchInstances
      ]);

    }
  };
}
