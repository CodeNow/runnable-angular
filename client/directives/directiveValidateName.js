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
      instance: '=instance'
    },
    link: function ($scope, element, attrs, ctrl) {
      ctrl.$setValidity('nameAvailable', true);

      function checkValid (name) {
        if (!name || ctrl.$pristine) {
          ctrl.$setValidity('nameAvailable', true);
          return name;
        }
        if (!$scope.instances) {
          return name;
        }
        if (name === keypather.get($scope, 'instance.attrs.name')) {
          // if user enters same name as current instance,
          // set validity to true. SAN-288
          ctrl.$setValidity('nameAvailable', true);
        } else {
          var match = $scope.instances.find(function (m) {
            return (m.attrs.name === name);
          });
          ctrl.$setValidity('nameAvailable', !match);
        }
        $rootScope.safeApply();
        return name;
      }

      // called when value changes via code/controller
      ctrl.$formatters.unshift(checkValid);
      // called when value changes in input element
      ctrl.$parsers.unshift(checkValid);
    }
  };
}
