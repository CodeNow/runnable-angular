require('app')
  .directive('fileTree', fileTree);
/**
 * fileTree Directive
 * @ngInject
 */
function fileTree(
  $timeout,
  keypather
) {
  return {
    restrict: 'E',
    templateUrl: 'viewFileTree',
    replace: true,
    scope: {
      readOnly: '=',
      rootDir: '=',
      openFiles: '='
    },
    link: function ($scope, element, attrs) {
      var actions = $scope.actions = {};
      var data = $scope.data = {};
      $scope.$watch('rootDir', function (newVal, oldVal) {
        if (newVal) {
          var rootDir = $scope.rootDir;
          rootDir.state = rootDir.state || {};
          rootDir.state.open = true;
        }
      });
    }
  };
}
