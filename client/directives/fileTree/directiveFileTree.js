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
  $rootScope,
  $state,
  $stateParams,
  user
) {
  return {
    restrict: 'E',
    templateUrl: 'viewFileTree',
    replace: true,
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
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, build, cb) {
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
            cb(err);
            $rootScope.safeApply();
          })
          .go();
      }

      async.series([
        fetchUser,
        fetchBuild
      ], function (err) {
        if (err) throw err;
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
          }
          else {
            instanceDeployedPoller = createInstanceDeployedPoller.start();
            var clearWatch =
              $scope.$watch('instance.containers.models[0].rootDir', function (rootDir) {
                clearWatch();
                $scope.rootDir = rootDir;
                initRootDirState($scope.rootDir);
              });
          }
        }
        $rootScope.safeApply();
      });

      function initRootDirState (rootDir) {
        rootDir.state = rootDir.state || {};
        rootDir.state.open = true;
      }
    }
  };
}
