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
      ctrl.setCustomValidity('Give your box an alphanumeric name without hyphens');

      function checkValid(name) {
        if (!name || ctrl.$pristine) {
          ctrl.$setValidity('envPattern', true);
          return name;
        }
        var test = /^[A-Za-z0-9_]+$/;
        if (!test.test(name)) {
          ctrl.checkValidity();
        }
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
