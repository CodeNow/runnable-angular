'use strict';

require('app')
  .directive('fileTree', fileTree);
/**
 * fileTree Directive
 * @ngInject
 */
function fileTree(
  keypather,
  fetchUser,
  $rootScope,
  $state,
  $stateParams,
  createInstanceDeployedPoller,
  fetchInstances,
  errs
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

      if ($stateParams.buildId) {
        // fetch('build', $stateParams.buildId)
        // .then(function(build) {
        //   $scope.build = build;
        //   $scope.rootDir = $scope.build.contextVersions.models[0].rootDir;
        //   initRootDirState($scope.rootDir);
        // });
      } else {
        fetchInstances({
          name: $stateParams.instanceName
        })
        .then(function(instance) {
          $scope.instance = instance;
          $scope.build = instance.build;
          // instance page
          var container = keypather.get($scope.instance, 'containers.models[0]');
          if (container) {
            $scope.rootDir = container.rootDir;
            initRootDirState($scope.rootDir);
          } else {
            instanceDeployedPoller = createInstanceDeployedPoller($scope.instance).start();
            var clearWatch =
              $scope.$watch('instance.containers.models[0].rootDir', function (rootDir) {
                if (!rootDir) { return; }
                clearWatch();
                $scope.rootDir = rootDir;
                initRootDirState($scope.rootDir);
              });
          }
        }).catch(errs.handler);
      }

      function initRootDirState (rootDir) {
        rootDir.state = rootDir.state || {};
        rootDir.state.open = true;
      }
    }
  };
}
