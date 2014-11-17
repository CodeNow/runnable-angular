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
    templateUrl: 'viewEnvValidation',
    link: function($scope) {
      // property controlled by directiveEnvVars
      $scope.$watch('stateModel.env', function (newEnvVal) {
        $scope.envValidation = validateEnvVars(newEnvVal);
      });
    }
  };
}
