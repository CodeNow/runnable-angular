require('app')
  .directive('runnableNewBoxInfo', RunnableNewBoxInfo);
/**
 * @ngInject
 */
function RunnableNewBoxInfo (
  async,
  $rootScope,
  $scope,
  user
) {
  return {
    restrict: 'E',
    templateUrl: 'viewNewBoxInfo',
    replace: true,
    scope: {},
    link: function ($scope, elem, attrs) {

    }
  };
}
