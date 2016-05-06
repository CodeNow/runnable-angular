'use strict';

require('app').directive('noDoubleDashValidator', noDoubleDashValidator);

function noDoubleDashValidator() {
  return {
    require: 'ngModel',
    restrict: 'A',
    link: function ($scope, elem, attrs, ngModel) {
      ngModel.$validators.noDoubleDash = function (modelValue, viewValue) {
        if (ngModel.$isEmpty(modelValue)) {
          // consider empty models to be valid
          return true;
        }
        var lowerCaseViewValue = viewValue.toLowerCase();
        return lowerCaseViewValue.indexOf('--') === -1;
      };
    }
  };
}
