'use strict';

require('app').directive('uniqueValidator', uniqueValidator);

function uniqueValidator() {
  return {
    require: 'ngModel',
    restrict: 'A',
    scope: {
      uniqueValidator: '='
    },
    link: function ($scope, elem, attrs, ngModel) {
      ngModel.$validators.unique = function (modelValue, viewValue) {
        if (ngModel.$isEmpty(modelValue)) {
          // consider empty models to be valid
          return true;
        }
        var lowerCaseViewValue = viewValue.toLowerCase();
        if (!$scope.uniqueValidator) {
          return true;
        }
        return $scope.uniqueValidator.every(function (item) {
          return item.toLowerCase() !== lowerCaseViewValue;
        });
      };
    }
  };
}
