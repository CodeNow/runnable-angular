require('app')
  .directive('runnableExplorer', RunnableExplorer);
/**
 * @ngInject
 */
function RunnableExplorer(
  async,
  keypather,
  QueryAssist,
  $rootScope,
  $stateParams,
  user
) {
  return {
    restrict: 'E',
    templateUrl: 'viewExplorer',
    replace: true,
    scope: {
      openItems: '=',
      toggleTheme: '='
    },
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
            if (err) throw err;
            cb();
          })
          .go();
      }

      function fetchInstance(cb) {
        new QueryAssist($scope.user, cb)
          .wrapFunc('fetchInstances')
          .query({
            githubUsername: $stateParams.userName,
            name: $stateParams.instanceName
          })
          .cacheFetch(function (instances, cached, cb) {
            if (!cached && !instances.models.length) {
              return cb(new Error('Instance not found'));
            }
            var instance = instances.models[0];
            $scope.instance = instance;
            $scope.build = instance.build;
            $rootScope.safeApply();
          })
          .resolve(function (err, instances, cb) {
            var instance = instances.models[0];
            if (!keypather.get(instance, 'containers.models') || !instance.containers.models.length) {
              return cb(new Error('instance has no containers'));
            }
            $rootScope.safeApply();
            cb(err);
          })
          .go();
      }

      function fetchBuild(cb) {
        if (!$stateParams.buildId) {
          return fetchInstance(cb);
        }
        new QueryAssist($scope.user, cb)
          .wrapFunc('fetchBuild')
          .query($stateParams.buildId)
          .cacheFetch(function (build, cached, cb) {
            $scope.build = build;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, build, cb) {
            if (err) throw err;
            cb();
          })
          .go();
      }

      async.series([
        fetchUser,
        fetchBuild
      ]);

    }
  };
}
