require('app')
  .directive('runnableInstanceBoxName', RunnableInstanceBoxName);
/**
 * @ngInject
 */
function RunnableInstanceBoxName (
  async,
  $rootScope,
  user
) {
  return {
    restrict: 'E',
    templateUrl: 'viewInstanceBoxName',
    replace: true,
    scope: {},
    link: function ($scope, elem, attrs) {
    }
  };
}