'use strict';

require('app')
  .directive('explorer', explorer);
/**
 * @ngInject
 */
function explorer() {
  return {
    restrict: 'A',
    templateUrl: 'explorerView',
    controller: 'FilePopoverController as FPC',
    scope: {
      instance: '=',
      getDisplayName: '=?',
      openItems: '=',
      fileModel: '=',
      rootDir: '=',
      explorerTitle: '@',
      toggleTheme: '=',
      showRepoFolder: '=',
      editExplorer: '=?',
      loadingPromisesTarget: '@?',
      readOnly: '=?',
      debugContainer: '=?',
      dir: '=rootDir'
    },
    link: function ($scope) {
      $scope.state = {};

      $scope.filePopover = {
        data: {
          show: false,
          canUpload: $scope.editExplorer,
          canAddRepo: $scope.editExplorer
        }
      };

      $scope.$watch('rootDir', function (rootDir) {
        if (!rootDir) { return; }
        initRootDirState(rootDir);
      });

      function initRootDirState (rootDir) {
        rootDir.state = rootDir.state || {};
        rootDir.state.open = true;
      }
    }
  };
}
