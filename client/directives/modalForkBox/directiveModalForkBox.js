require('app')
  .directive('runnableModalForkBox', RunnableModalForkBox);
/**
 * directive RunnableModalForkBox
 * @ngInject
 */
function RunnableModalForkBox(
) {
  return {
    restrict: 'E',
    templateUrl: 'viewModalForkBox',
    replace: true,
    scope: {},
    link: function ($scope, element, attrs) {
    }
  };
}