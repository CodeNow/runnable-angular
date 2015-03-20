'use strict';

require('app')
  .directive('explorer', explorer);
/**
 * @ngInject
 */
function explorer(
  helperCreateFS,
  errs
) {
  return {
    restrict: 'A',
    templateUrl: 'viewExplorer',
    scope: {
      openItems: '=',
      fileModel: '=',
      rootDir: '=',
      title: '@',
      toggleTheme: '=',
      showRepoFolder: '='
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

      var unwatch = $scope.$watch('rootDir', function (rootDir) {
        if (!rootDir) { return; }
        unwatch();
        initRootDirState(rootDir);
      });

      function initRootDirState (rootDir) {
        rootDir.state = rootDir.state || {};
        rootDir.state.open = true;
      }
    }
  };
}
