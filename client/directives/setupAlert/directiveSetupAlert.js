require('app')
  .directive('runnableSetupAlert', RunnableSetupAlert);
/**
 * @ngInject
 */
function RunnableSetupAlert(
) {
  return {
    restrict: 'E',
    templateUrl: 'viewSetupAlert',
    replace: true,
    scope: {},
    link: function($scope, elem, attrs) {
    }
  };
}
