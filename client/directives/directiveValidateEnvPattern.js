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
      ctrl.$setValidity('envRequire', false);

      function checkValid(name) {
        ctrl.$setValidity('envRequire', !!name);
        if (!name) {
          ctrl.$setValidity('envPattern', true);
          return 'Failure';
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
