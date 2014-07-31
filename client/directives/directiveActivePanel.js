require('app')
  .directive('activePanel', activePanel);
/**
 * activePanel Directive
 * @ngInject
 */
function activePanel(
  $timeout,
  $sce,
  async,
  debounce,
  keypather
) {
  return {
    restrict: 'E',
    templateUrl: 'viewActivePanel',
    replace: true,
    scope: {
      container: '=',
      openFiles: '=',
      readOnly: '=',
      update: '=',
      isDarkTheme: '='
    },
    link: function ($scope, element, attrs) {

      $scope.$sce = $sce;

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
      updateFileDebounce = debounce(updateFile, 333);

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

      if ($scope.update) {
        $scope.$watch('openFiles.activeFile.state.body', function (newval, oldval) {
          if (typeof newval === 'string' && $scope.openFiles.activeFile) {
            async.series([
              updateFileDebounce
            ], function () {});
          }
        });
      }

      $scope.$watch('openFiles.activeFile.attrs._id', function (newval, oldval) {
        if (typeof newval === 'string' && $scope.openFiles.activeFile.type === 'file') {
          fetchFile(newval);
        }
      });
    }
  };
}
