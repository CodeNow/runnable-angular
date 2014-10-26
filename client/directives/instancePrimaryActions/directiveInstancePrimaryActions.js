require('app')
  .directive('runnableInstancePrimaryActions', RunnableInstancePrimaryActions);
/**
 * @ngInject
 */
function RunnableInstancePrimaryActions (
  async,
  $rootScope,
  user
) {
  return {
    restrict: 'E',
    templateUrl: 'viewInstancePrimaryActions',
    replace: true,
    scope: {},
    link: function ($scope, elem, attrs) {
    }
  };
}