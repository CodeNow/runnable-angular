'use strict';

require('app')
  .directive('validateEnvPattern', validateEnvPattern);
/**
 * @ngInject
 */
function validateEnvPattern(
) {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function ($scope, element, attrs, ctrl) {

      ctrl.$setValidity('envPattern', true);

      function checkValid(name) {
        if (!name || ctrl.$pristine) {
          ctrl.$setValidity('envPattern', true);
          return name;
        }
        var test = /^[A-Za-z0-9_]+$/;
        ctrl.$setValidity('envPattern', test.test(name));
        return name;
      }

      // called when value changes via code/controller
      ctrl.$formatters.unshift(checkValid);
      // called when value changes in input element
      ctrl.$parsers.unshift(checkValid);
    }
  };
}
