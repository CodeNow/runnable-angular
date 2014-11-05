require('app')
  .directive('runnableEnvValidation', RunnableEnvValidation);
/**
 * @ngInject
 */
function RunnableEnvValidation(

) {
  return {
    restrict: 'E',
    replace: true,
    scope: {},
    templateUrl: 'viewEnvValidation',
    link: function($scope, elem, attrs) {
    }
  };
}
