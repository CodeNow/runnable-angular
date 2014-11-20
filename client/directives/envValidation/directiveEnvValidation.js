require('app')
  .directive('envValidation', envValidation);
/**
 * @ngInject
 */
function envValidation(
  validateEnvVars
) {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      stateModel: '='
    },
    link: function($scope) {
      // property controlled by directiveEnvVars
      $scope.$watch('stateModel.env', function (newEnvVal) {
        if ($scope.stateModel) {
          $scope.stateModel.envValidation = validateEnvVars(newEnvVal);
        }
      });
    }
  };
}
