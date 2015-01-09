'use strict';

require('app')
  .directive('explorer', explorer);
/**
 * @ngInject
 */
function explorer(
  async,
  keypather,
  QueryAssist,
  fetchUser,
  $rootScope,
  $stateParams,
  user
) {
  return {
    restrict: 'A',
    templateUrl: 'viewExplorer',
    scope: {
      openItems: '=',
      toggleTheme: '='
    },
    link: function ($scope, elem, attrs) {

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
          })
          .resolve(function (err, instances, cb) {
            var instance = instances.models[0];
            if (!keypather.get(instance, 'containers.models') || !instance.containers.models.length) {
              return cb(new Error('instance has no containers'));
            }
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
            cb();
          })
          .resolve(function (err, build, cb) {
            if (err) { throw err; }
            cb();
          })
          .go();
      }

      async.series([
        function (cb) {
          fetchUser(function (err, user) {
            if (err) { return cb(err); }
            $scope.user = user;
            cb();
          });
        },
        fetchBuild
      ]);

    }
  };
}
