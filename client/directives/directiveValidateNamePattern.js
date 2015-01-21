'use strict';

require('app')
  .directive('validateNamePattern', validateNamePattern);
/**
 * @ngInject
 */
function validateNamePattern(
  $rootScope
) {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function ($scope, element, attrs, ctrl) {

      ctrl.$setValidity('namePattern', true);

      function checkValid(name) {
        if (!name || ctrl.$pristine) {
          ctrl.$setValidity('namePattern', true);
          return name;
        }
        var test = /^[A-Za-z0-9]([A-Za-z0-9_-]*[A-Za-z0-9])?$/;
        ctrl.$setValidity('namePattern', test.test(name));
        return name;
      }

      // called when value changes via code/controller
      ctrl.$formatters.unshift(checkValid);
      // called when value changes in input element
      ctrl.$parsers.unshift(checkValid);
    }
  };
}
