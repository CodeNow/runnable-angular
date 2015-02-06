'use strict';

require('app')
  .directive('fileTreeRoot', fileTreeRoot);
/**
 * fileTreeRoot Directive
 * @ngInject
 */
function fileTreeRoot(
  keypather,
  fetchBuild,
  $stateParams,
  fetchInstances,
  errs
) {
  return {
    restrict: 'A',
    templateUrl: 'viewFileTreeRoot',
    scope: {
      openItems: '='
    },
    link: function ($scope, element, attrs) {
      var actions = $scope.actions = {};
      var data = $scope.data = {};

      if ($stateParams.buildId) {
        fetchBuild($stateParams.buildId).then(function(build) {
          $scope.build = build;
          $scope.rootDir = $scope.build.contextVersions.models[0].rootDir;
          initRootDirState($scope.rootDir);
        });
      } else {
        fetchInstances({
          name: $stateParams.instanceName
        }).then(function(instance) {
          $scope.instance = instance;
          $scope.build = instance.build;
          // instance page
          var container = keypather.get($scope.instance, 'containers.models[0]');
          if (container) {
            $scope.rootDir = container.rootDir;
            initRootDirState($scope.rootDir);
          } else {
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
