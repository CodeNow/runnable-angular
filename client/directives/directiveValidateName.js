'use strict';

require('app')
  .directive('validateName', validateName);
/**
 * @ngInject
 */
function validateName(
  $rootScope,
  keypather
) {
  return {
    restrict: 'A',
    require: 'ngModel',
    scope: {
      instances: '=validateName',
      instance: '=instance',
      currentInstanceValid: '=validateNameCurrentInstanceValid'
    },
    link: function ($scope, element, attrs, ctrl) {
      ctrl.$setValidity('nameAvailable', true);

      function checkValidNameAvailable(name) {
        ctrl.$setValidity('nameRequire', !!name);
        if (ctrl.$pristine) {
          ctrl.$setValidity('nameAvailable', true);
          return name;
        }
        if (!$scope.instances) {
          return name;
        }
        if (name === keypather.get($scope, 'instance.attrs.name')) {
          // if user enters same name as current instance,
          // set validity to true. SAN-288

          // UPDATE: OR if $scope.currentInstanceValid
          // then current name is not a valid option
          ctrl.$setValidity('nameAvailable', $scope.currentInstanceValid);

        } else {
          var match = $scope.instances.find(function (m) {
            return (m.attrs.name.toLowerCase() === name.toLowerCase());
          });
          ctrl.$setValidity('nameAvailable', !match);
        }
        return name;
      }

      // called when value changes via code/controller
      ctrl.$formatters.unshift(checkValidNameAvailable);
      // called when value changes in input element
      ctrl.$parsers.unshift(checkValidNameAvailable);
    }
  };
}
