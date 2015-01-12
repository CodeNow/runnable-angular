'use strict';

require('app')
  .directive('modalStackDependencies', modalStackDependencies);
/**
 * @ngInject
 */
function modalStackDependencies(
  keypather,
  fetchGSDepInstances,
  getNewForkName
) {
  return {
    restrict: 'A',
    templateUrl: 'viewModalStackDependencies',
    scope: {
      allDependencies: '=',
      actions: '=',
      state: '='
    },
    link: function ($scope, elem, attrs) {
      $scope.$watch('allDependencies', function (n) {
        if (n) {
          keypather.set($scope, 'addDependencyPopover.data.dependencies', $scope.allDependencies);
        }
      });

      $scope.$watch('state.dependencies', function (n) {
        if (n) {
          keypather.set($scope, 'addDependencyPopover.data.state.dependencies',
            $scope.state.dependencies);
        }
      });
    }
  };
}
