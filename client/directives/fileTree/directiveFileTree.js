'use strict';

require('app')
  .directive('fileTree', fileTree);
/**
 * fileTree Directive
 * @ngInject
 */
function fileTree(
  async,
  keypather,
  QueryAssist,
  fetchUser,
  $rootScope,
  $state,
  $stateParams,
  createInstanceDeployedPoller,
  user
) {
  return {
    restrict: 'A',
    templateUrl: 'viewFileTree',
    scope: {
      openItems: '='
    },
    link: function ($scope, element, attrs) {
      var instanceDeployedPoller;
      var actions = $scope.actions = {};
      var data = $scope.data = {};

      switch ($state.$current.name) {
      case 'instance.instanceEdit':
        $scope.readOnly = false;
        break;
      case 'instance.instance':
        $scope.readOnly = false;
        break;
      case 'instance.setup':
        $scope.readOnly = false;
        break;
      }

      $scope.$on('$destroy', function () {
        if (instanceDeployedPoller) {
          instanceDeployedPoller.clear();
        }
      });

      /**
       * use buildId if stateParams.buildId (instance.setup)
       * otherwise fetch instance & build (instance.instance && instance.edit)
       */
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
            cb(err);
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
      ], function (err) {
        if (err) { throw err; }
        if ($stateParams.buildId) {
          // instance edit page
          // build context version will always exist
          $scope.rootDir = $scope.build.contextVersions.models[0].rootDir;
          initRootDirState($scope.rootDir);
        }
        else {
          // instance page
          var container = keypather.get($scope.instance, 'containers.models[0]');
          if (container) {
            $scope.rootDir = container.rootDir;
            initRootDirState($scope.rootDir);
          }
          else {
            instanceDeployedPoller = createInstanceDeployedPoller($scope.instance).start();
            var clearWatch =
              $scope.$watch('instance.containers.models[0].rootDir', function (rootDir) {
                if (!rootDir) { return; }
                clearWatch();
                $scope.rootDir = rootDir;
                initRootDirState($scope.rootDir);
              });
          }
        }
      });

      function initRootDirState (rootDir) {
        rootDir.state = rootDir.state || {};
        rootDir.state.open = true;
      }
    }
  };
}
