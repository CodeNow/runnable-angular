require('app')
  .directive('activePanel', activePanel);
/**
 * activePanel Directive
 * @ngInject
 */
function activePanel(
  debounce,
  keypather
) {
  return {
    restrict: 'E',
    templateUrl: 'viewActivePanel',
    replace: true,
    scope: {
      openFiles: '='
    },
    link: function ($scope, element, attrs) {
      $scope.activeFileClone = {};

      var updateFile = function updateFile() {
        if (!keypather.get($scope.openFiles, 'activeFile')) {
          return;
        }
        $scope.openFiles.activeFile.update({
          json: {
            body: $scope.activeFileClone.body
          }
        }, function () {});
      };
      updateFile = debounce(updateFile, 300);
      $scope.updateFile = function () {
        updateFile();
      };

      $scope.$watch('openFiles.activeFile.attrs._id', function (newval, oldval) {
        if (typeof newval === 'string'){
          $scope.activeFileClone = angular.copy($scope.openFiles.activeFile.attrs);
        }
      });
    }
  };
}
