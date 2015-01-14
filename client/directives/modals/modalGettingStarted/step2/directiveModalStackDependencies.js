'use strict';

require('app')
  .directive('modalStackDependencies', modalStackDependencies);
/**
 * @ngInject
 */
function modalStackDependencies(
  keypather,
  fetchInstances
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
      fetchInstances(null, null, function (err, instances) {
        keypather.set($scope, 'addDependencyPopover.data.instances', instances);
      });

      $scope.$watchCollection('state.dependencies', function (n) {
        if (n) {
          keypather.set($scope, 'addDependencyPopover.data.state.dependencies', n);
        }
      });
    }
  };
}
