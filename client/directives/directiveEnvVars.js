require('app')
  .directive('EnvVars', envVars);
/**
 * @ngInject
 */
function envVars(
) {
  return {
    restrict: 'E',
    replace: true,
    scope: {},
    templateUrl: 'viewEnvVars',
    link: function ($scope, elem, attrs) {
    }
  };
}

