require('app')
  .directive('activePanel', activePanel);
/**
 * activePanel Directive
 * @ngInject
 */
function activePanel(
  async,
  debounce,
  keypather,
  $timeout
) {
  return {
    restrict: 'E',
    templateUrl: 'viewActivePanel',
    replace: true,
    scope: {
      openFiles: '=',
      isClean: '=', // build.attrs.started
      isReadOnly: '=',
      isDarkTheme: '=',
      forkBuild: '&'
    },
    link: function ($scope, element, attrs) {
      $scope.activeFileClone = {};

      function updateFile (cb) {
        $scope.openFiles.activeFile.update({
          json: {
            body: $scope.activeFileClone.body
          }
        }, function () {
          $timeout(function () {
            $scope.$apply();
          });
        });
      }

      function fetchFile() {
        $scope.activeFileClone = angular.copy($scope.openFiles.activeFile.attrs);
        $scope.openFiles.activeFile.fetch(function () {
          $scope.activeFileClone = angular.copy($scope.openFiles.activeFile.attrs);
          $scope.activeFileClone.delay = true;
          $timeout(function () {
            $scope.$apply();
          });
        });
      }

      $scope.$watch('activeFileClone.body', function (newval, oldval) {
        if (typeof newval === 'string' && $scope.openFiles.activeFile) {
          // prevent assignment to aFC.body triggering update
          if ($scope.activeFileClone.delay) {
            delete $scope.activeFileClone.delay;
            return;
          }
          async.series([
            $scope.fork,
            updateFile
          ], function () {});
        }
      });

      $scope.$watch('openFiles.activeFile.attrs._id', function (newval, oldval) {
        if (typeof newval === 'string') {
          fetchFile(newval);
        }
      });
    }
  };
}
