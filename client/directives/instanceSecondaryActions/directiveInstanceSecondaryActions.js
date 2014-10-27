require('app')
  .directive('runnableInstanceSecondaryActions', RunnableInstanceSecondaryActions);
/**
 * @ngInject
 */
function RunnableInstanceSecondaryActions (
) {
  return {
    restrict: 'E',
    templateUrl: 'viewInstanceSecondaryActions',
    replace: true,
    scope: {},
    link: function ($scope, elem, attrs) {
    }
  };
}
