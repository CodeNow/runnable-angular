require('app')
  .directive('runnableInstanceList', RunnableInstanceList);
/**
 * @ngInject
 */
function RunnableInstanceList (
  async,
  determineActiveAccount,
  $filter,
  getInstanceClasses,
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

      $scope.stateToNew = function () {
        $state.go('instance.new', {
          userName: $scope.activeAccount.oauthId()
        });
      };

      $scope.stateToInstance = function (instance) {
        $state.go('instance.instance', {
          instanceName: instance.attrs.name,
          userName: instance.attrs.owner.github.username
        });
      };

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
          cb();
        });
      }

      function fetchInstances (cb) {
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
              .resolve(function (err, projects, cb) {
              })
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
