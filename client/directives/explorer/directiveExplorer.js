'use strict';

require('app')
  .directive('explorer', explorer);
/**
 * @ngInject
 */
function explorer(
  helperCreateFS,
  keypather,
  fetchBuild,
  $stateParams,
  fetchInstances,
  errs
) {
  return {
    restrict: 'A',
    templateUrl: 'viewExplorer',
    scope: {
      openItems: '=',
      toggleTheme: '='
    },
    link: function ($scope, elem, attrs) {
      $scope.filePopover = {
        data: {
          show: false
        },
        actions: {
          createFile: function() {
            helperCreateFS($scope.rootDir, {
              isDir: false
            }, errs.handler);
            $scope.filePopover.data.show = false;
          },
          createFolder: function() {
            helperCreateFS($scope.rootDir, {
              isDir: true
            }, errs.handler);
            $scope.filePopover.data.show = false;
          }
        }
      };

      if ($stateParams.buildId) {
        $scope.title = 'Build Files';
        fetchBuild($stateParams.buildId).then(function(build) {
          $scope.build = build;
          $scope.rootDir = $scope.build.contextVersions.models[0].rootDir;
          initRootDirState($scope.rootDir);
        });
      } else {
        $scope.title = 'File Explorer';
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
