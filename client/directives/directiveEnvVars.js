require('app')
  .directive('envVars', envVars);
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

