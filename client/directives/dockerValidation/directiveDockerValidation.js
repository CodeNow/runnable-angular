require('app')
  .directive('runnableDockerValidation', RunnableDockerValidation);
/**
 * @ngInject
 */
function RunnableDockerValidation (
  debounce,
  $rootScope,
  validateDockerfile
) {
  return {
    restrict: 'E',
    templateUrl: 'viewDockerValidation',
    replace: true,
    scope: {
      openItems: '='
    },
    link: function ($scope, elem, attrs) {
      $scope.$watch('openItems.activeHistory.last().attrs.body', function (n) {
        if (n === undefined) return;
        if ($scope.openItems.activeHistory.last().id() !== '/Dockerfile') {
          $scope.validDockerfile = {
            valid: true
          };
          return;
        }
        $scope.validDockerfile = validateDockerfile(n);
      });
    }
  };
}
