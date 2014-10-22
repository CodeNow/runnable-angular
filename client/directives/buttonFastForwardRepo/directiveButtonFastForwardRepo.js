require('app')
  .directive('runnableButtonFastForwardRepo', RunnableButtonFastForwardRepo);
/**
 * @ngInject
 */
function RunnableButtonFastForwardRepo (
) {
  return {
    restrict: 'E',
    templateUrl: 'viewButtonFastForwardRepo',
    replace: true,
    scope: {},
    link: function ($scope, elem, attrs) {
    }
  };
}
