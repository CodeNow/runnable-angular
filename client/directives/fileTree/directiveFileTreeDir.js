require('app')
  .directive('fileTreeDir', fileTreeDir);
/**
 * fileTreeDir Directive
 * @ngInject
 */
function fileTreeDir(
  $templateCache,
  $compile,
  $timeout
) {
  return {
    restrict: 'E',
    scope: {
      dir: '=',
      open: '=',
      version: '='
    },
    link: function ($scope, element, attrs) {
      var actions = $scope.actions = {};
      var data = $scope.data = {};
      data.open = $scope.open;

      function fetchDirFiles () {
        data.dirFiles = $scope.version.fetchFiles({
          Prefix: $scope.dir.filepath()
        }, function () {
          $timeout(function () {
            $scope.$apply();
          });
        });
      }
      // make sure version exists and open === true before fetching
      $scope.$watch('version', function (newval, oldval) {
        if(!newval || !data.open) return;
        fetchDirFiles();
      });
      $scope.$watch('data.open', function (newval, oldval) {
        if(!newval || !$scope.version) return;
        fetchDirFiles();
      });

      // avoid infinite loop w/ nested directories
      var template = $templateCache.get('viewFileTreeDir');
      var $template = angular.element(template);
      $compile($template)($scope);

      // element.replaceWith($template);
      element.append($template);

    }
  };
}
