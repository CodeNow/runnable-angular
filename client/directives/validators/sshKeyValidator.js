'use strict';

require('app')
  .directive('sshKeyValidator', sshKeyValidator);
/**
 * @ngInject
 */
function sshKeyValidator(
  sshValidation
) {
  return {
    require: 'ngModel',
    link: function (scope, elem, attr, ngModel) {
      ngModel.$validators.malformed = function (modelValue, viewValue) {
        var value = modelValue || viewValue;
        return !!value && sshValidation.isKeyValid(value);
      };
    }
  };
}