'use strict';

require('app')
  .directive('modalStackSelector', modalStackSelector);
/**
 * @ngInject
 */
function modalStackSelector(
  keypather
) {
  return {
    restrict: 'A',
    templateUrl: 'viewModalStackSelector',
    scope: {
      data: '=',
      actions: '=',
      state: '='
    },
    link: function ($scope, elem, attrs) {
      $scope.$watch('state.stack', function (stack, p) {
        if (stack) {
          keypather.set($scope, 'state.ports', stack.ports);
          keypather.set($scope, 'state.startCommand', stack.startCommand);
        }
      });
    }
  };
}
