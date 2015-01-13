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
      data: '=',
      actions: '=',
      state: '='
    },
    link: function ($scope, elem, attrs) {
      $scope.$watch('data.allDependencies', function (n) {
        if (n) {
          keypather.set($scope, 'addDependencyPopover.data.dependencies', n);
        }
      });

      $scope.$watchCollection('state.dependencies', function (n) {
        if (n) {
          keypather.set($scope, 'addDependencyPopover.data.state.dependencies', n);
        }
      });
    }
  };
}
