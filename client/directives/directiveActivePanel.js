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
      openItems: '=',
      readOnly: '=',
      update: '=',      // true: save file when content changes
      isDarkTheme: '='
    },
    link: function ($scope, element, attrs) {

      $scope.$sce = $sce;

      function updateFile (cb) {
        var activeFile = $scope.openFiles.activeFile;
        // Check to make sure it's a real file
        // and not a stupid fake file that almost got me fired
        // https://www.youtube.com/watch?v=CCrfzyRFMfg
        if (!activeFile || activeFile.constructor.name !== 'File') { return; }
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
            updateFileDebounce();
          }
        });
        $scope.$watchCollection('[readOnly, openFiles.activeFile]', function (newVal) {
          if (!newVal) {
            $scope.isReadOnly = newVal;
          } else if (keypather.get($scope, 'openFiles.activeFile')) {
            // We should be in readonly mode if we don't have an active file
            $scope.isReadOnly = $scope.openFiles.activeFile.constructor.name !== 'File';
          } else {
            $scope.isReadOnly = true;
          }
        });
      } else {
        $scope.isReadOnly = true;
      }

      $scope.$watch('openFiles.activeFile.attrs._id', function (newval, oldval) {
        if (typeof newval === 'string' && $scope.openFiles.activeFile.type === 'file') {
          fetchFile(newval);
        }
      });
    }
  };
}
