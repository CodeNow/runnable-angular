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

      //For DOM -> model validation
      ngModel.$parsers.unshift(function (value) {
        var valid = !!value && sshValidation.isKeyValid(value);
        ngModel.$setValidity('malformed', valid);
        return valid ? value : undefined;
      });

      //For model -> DOM validation
      ngModel.$formatters.unshift(function (value) {
        ngModel.$setValidity('malformed',  !!value && sshValidation.isKeyValid(value));
        return value;
      });
    }
  };
}