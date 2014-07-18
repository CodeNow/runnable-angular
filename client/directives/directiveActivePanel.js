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
        $scope.openFiles.activeFile.update({
          json: {
            body: $scope.activeFileClone.body
          }
        }, function () {
          console.log(arguments);
        });
      };
      updateFile = debounce(updateFile, 300);

      function fetchFile() {
        $scope.openFiles.activeFile.fetch(function() {
          $scope.activeFileClone = angular.copy($scope.openFiles.activeFile.attrs);
          $scope.activeFileClone.delay = true;
          $scope.safeApply();
        });
      }

      $scope.$watch('activeFileClone.body', function (newval, oldval) {
        if(typeof newval === 'string' && $scope.openFiles.activeFile) {
          if ($scope.activeFileClone.delay){
            delete $scope.activeFileClone.delay;
            return;
          }
          updateFile();
        }
      });

      $scope.$watch('openFiles.activeFile.attrs._id', function (newval, oldval) {
        if (typeof newval === 'string'){
          fetchFile(newval);
        }
      });
    }
  };
}
