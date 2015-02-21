'use strict';

require('app')
  .directive('validateEnvPattern', validateEnvPattern);
/**
 * @ngInject
 */
function validateEnvPattern(
  validateEnvVars
) {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function ($scope, element, attrs, ctrl) {

      ctrl.$setValidity('envPattern', true);

      function checkValid(envLine) {
        if (!envLine) {
          ctrl.$setValidity('envPattern', true);
          return envLine;
        }
        var result = validateEnvVars(envLine);
        ctrl.$setValidity('envPattern', result.valid);
        return envLine;
      }

      // called when value changes via code/controller
      ctrl.$formatters.unshift(checkValid);
      // called when value changes in input element
      ctrl.$parsers.unshift(checkValid);
    }
  };
}
