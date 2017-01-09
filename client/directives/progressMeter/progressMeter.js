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
      scope.meterMax = scope.meterMax || 1;
      scope.ticks = new Array(scope.meterMax);
      scope.getClass = function () {
        var step = 'meter-' + scope.step;
        var meterMax = 'meter-max-' + scope.meterMax;
        var classObj = {};
        classObj[step] = true;
        classObj[meterMax] = true;
        return classObj;
      };
      scope.$watch(scope.meterMax, function () {
        scope.ticks = new Array(scope.meterMax);
      });
    }
  };
}
