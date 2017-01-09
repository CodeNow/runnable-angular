'use strict';

require('app')
  .directive('progressMeter', progressMeter);

/**
 * @ngInject
 */
function progressMeter(
) {
  return {
    restrict: 'E',
    templateUrl: 'progressMeter',
    scope: {
      step: '=',
      meterMax: '='
    },
    link: function (scope, elem, attrs) {
      scope.ticks = new Array(scope.meterMax || 6);
      scope.$watch(scope.meterMax, function () {
        scope.ticks = new Array(scope.meterMax);
      });
    }
  };
}
