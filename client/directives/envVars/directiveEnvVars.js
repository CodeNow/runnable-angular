require('app')
  .directive('envVars', envVars);
/**
 * @ngInject
 */
function envVars(
  keypather
) {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      item: '=',
      currentModel: '=',
      stateModel: '='
    },
    templateUrl: 'viewEnvVars',
    link: function ($scope, elem, attrs) {

      $scope.environmentalVars = '';

      // Watch the current model for envs
      var unreg = $scope.$watch('currentModel.env', function (env) {
        if (!Array.isArray(env)) {
          return;
        }
        // If we have some, add them to the screen
        $scope.environmentalVars = env.reduce(function (environmentalVars, env) {
          return environmentalVars + env + '\n';
        }, '');
      });

      // Add the validity checker
      $scope.validity = {
        valid: true,
        errors: []
      };
      // When the envs on the screen change
      $scope.$watch('environmentalVars', function (newEnv, oldEnv) {
        // Since the user has inputed text, we don't need to listen to the current model anymore
        unreg();
        // If the envs haven't changed, (also takes care of first null/null occurrence)
        if (newEnv === oldEnv) return;
        // Save them to the state model
        keypather.set($scope, 'stateModel.env', newEnv.split('\n').filter(function (v) {
          return v.length;
        }));
      });

    }
  };
}
