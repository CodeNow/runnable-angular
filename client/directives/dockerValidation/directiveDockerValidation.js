'use strict';

require('app')
  .directive('dockerValidation', dockerValidation);
/**
 * @ngInject
 */
function dockerValidation(
  debounce,
  $rootScope,
  validateDockerfile
) {
  return {
    restrict: 'E',
    templateUrl: 'viewDockerValidation',
    scope: {
      openItems: '='
    },
    link: function ($scope, elem, attrs) {
      $scope.$watch('openItems.activeHistory.last().attrs.body', function (n) {
        if (n === undefined) { return; }
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
