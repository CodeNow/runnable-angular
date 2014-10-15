require('app')
  .directive('runnableInstanceList', RunnableInstanceList);
/**
 * @ngInject
 */
function RunnableInstanceList (
  $rootScope,
  $state,
  $filter,
  user,
  async,
  QueryAssist,
  determineActiveAccount,
  getInstanceClasses,
  keypather
) {
  return {
    restrict: 'E',
    templateUrl: 'viewInstanceList',
    replace: true,
    scope: {},
    link: function ($scope, elem, attrs) {

      async.series([
        fetchUser,
        fetchOrgs,
        fetchInstances
      ]);

      $scope.getInstanceClasses = getInstanceClasses;

      $scope.getInstanceAltTitle = function (instance) {
        var state = $scope.getInstanceClasses(instance);
        if (state.failed) {
          return "Build failed";
        }
        if (state.running) {
          return "Started " + $filter('timeAgo')(keypather.get(instance, 'containers.models[0].attrs.inspect.State.StartedAt'));
        }
        if (state.stopped) {
          return "Stopped " + $filter('timeAgo')(keypather.get(instance, 'containers.models[0].attrs.inspect.State.FinishedAt'));
        }
        if (state.building) {
          return "Build in progress";
        }
        return "";
      };

      function fetchUser (cb) {
        new QueryAssist(user, cb)
          .wrapFunc('fetchUser')
          .query('me')
          .cacheFetch(function (user, cached, cb) {
            $scope.user = user;
            console.log('$scope.user', user);
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, user, cb) {
          })
          .go();
      }

      function fetchOrgs (cb) {
        $scope.orgs = $scope.user.fetchGithubOrgs(function (err) {
          if (err) throw err;
          // heap
          $scope.activeAccount = determineActiveAccount($state.params.userName, $scope.orgs, $scope.user);
          console.log('$scope.activeAccount', $scope.activeAccount);
          cb();
        });
      }

      function fetchInstances (cb) {
        new QueryAssist($scope.user, cb)
          .wrapFunc('fetchInstances', cb)
          .query({
            owner: {
              github: $scope.activeAccount.oauthId()
            }
          })
          .cacheFetch(function (instances, cached, cb) {
            console.log('$scope.instances', instances);
            $scope.instances = instances;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, projects, cb) {
          })
          .go();
      }

    }
  };
}
