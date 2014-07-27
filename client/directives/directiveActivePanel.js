require('app')
  .directive('activePanel', activePanel);
/**
 * activePanel Directive
 * @ngInject
 */
function activePanel(
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
      isClean: '=',
      isReadOnly: '=',
      isDarkTheme: '='
    },
    link: function ($scope, element, attrs) {
      $scope.activeFileClone = {};

      var updateFile = function updateFile() {
        if (!$scope.openFiles.activeFile) { return; }
        $scope.isClean = false;
        $scope.openFiles.activeFile.update({
          json: {
            body: $scope.activeFileClone.body
          }
        }, function () {
          console.log(arguments);
          $timeout(function () {
            $scope.$apply();
          });
        });
      };
      updateFile = debounce(updateFile, 300);

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

      $scope.$watch('activeFileClone.body', function (newVal, oldVal) {
        if (typeof newVal === 'string' && $scope.openFiles.activeFile) {
          if ($scope.activeFileClone.delay) {
            delete $scope.activeFileClone.delay;
            return;
          }
          updateFile();
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
