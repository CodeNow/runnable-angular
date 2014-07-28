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
      function updateFile (cb) {
        var activeFile = $scope.openFiles.activeFile;
        if (!activeFile) { return; }
        if (activeFile.state.isDirty()) {
          activeFile.update({
            json: {
              body: activeFile.state.body
            }
          }, function (err) {
            if (err) {
              throw err;
            }
            $timeout(function () {
              $scope.$apply();
            });
          });
        }
      }

      function fetchFile() {
        $scope.openFiles.activeFile.fetch(function (err) {
          if (err) { throw err; }
          if ($scope.openFiles.activeFile.state.body === undefined) {
            $scope.openFiles.activeFile.state.reset(); // first population
          }
          $timeout(function () {
            $scope.$apply();
          });
        });
      }

      $scope.$watch('openFiles.activeFile.state.body', function (newval, oldval) {
        if (typeof newval === 'string' && $scope.openFiles.activeFile) {
          async.series([
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
