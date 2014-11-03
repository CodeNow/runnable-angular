require('app')
  .directive('runnableModalEnvironment', RunnableModalEnvironment);
/**
 * directive RunnableModalEnvironment
 * @ngInject
 */
function RunnableModalEnvironment(
) {
  return {
    restrict: 'E',
    templateUrl: 'viewModalEnvironment',
    replace: true,
    scope: {},
    link: function ($scope, element, attrs) {
    }
  };
}