require('app')
  .directive('validateName', validateName);
/**
 * @ngInject
 */
function validateName(
  $rootScope,
  debounce
) {
  return {
    restrict: 'A',
    require: 'ngModel',
    scope: {
      projects: '=validateName'
    },
    link: function ($scope, element, attrs, ctrl) {
      ctrl.$setValidity('nameAvailable', true);

      var checkValid = debounce(function (name) {
        if (!name || ctrl.$pristine) {
          ctrl.$setValidity('nameAvailable', true);
          return name;
        }
        function testName() {
          var match = $scope.projects.find(function (m) {
            return (m.attrs.name === name);
          });
          ctrl.$setValidity('nameAvailable', !!!match);
          $rootScope.safeApply();
        }
        $scope.projects.fetch(function () {
          testName();
        });
        testName();
      }, 200, false);

      // called when value changes via code/controller
      ctrl.$formatters.unshift(checkValid);
      // called when value changes in input element
      ctrl.$parsers.unshift(checkValid);
    }
  };
}
