require('app')
  .directive('fileTreeDir', fileTreeDir);
/**
 * fileTreeDir Directive
 * @ngInject
 */
function fileTreeDir(
  $templateCache,
  $compile,
  $timeout,
  $rootScope
) {
  return {
    restrict: 'E',
    scope: {
      dir: '=',
      openItems: '=',
      readOnly: '='
    },
    template: '',
    link: function ($scope, element, attrs) {
      var actions = $scope.actions = {};
      var data = $scope.data = {};

      $scope.$watch('dir.state.open', function (newVal, oldval) {
        if (newVal) {
          fetchDirFiles();
        }
      });
      function fetchDirFiles() {
        $scope.dir.contents.fetch(function (err) {
          if (err) {
            throw err;
          }
          $scope.dir.contents.models.sort();
          $rootScope.safeApply();
        });
      }

      // avoid infinite loop w/ nested directories
      var template = $templateCache.get('viewFileTreeDir');
      var $template = angular.element(template);
      $compile($template)($scope);

      element.replaceWith($template);
      element.on('$destroy', function () {
        // IF BIND ANY EVENTS TO DOM, UNBIND HERE OR SUFFER THE MEMORY LEAKS
      });
    }
  };
}
