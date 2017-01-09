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
      scope.steps = new Array(scope.step);
    }
  };
}
