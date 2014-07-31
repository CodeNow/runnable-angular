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
      versionOrContext: '=',
      openFiles: '='
    },
    link: function ($scope, element, attrs) {
      var actions = $scope.actions = {};
      var data = $scope.data = {};
      function init() {
        data.rootDir = $scope.versionOrContext.newDir({
          id: $scope.versionOrContext.id() + 'newdir',
          isDir: true,
          path: '',
          name: '/'
        }, {
          idAttribute: 'id'
        });
      }
      $scope.$watch('versionOrContext', function (newval, oldval) {
        if (newval) {
          init();
        }
      });
    }
  };
}
