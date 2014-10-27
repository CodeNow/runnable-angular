require('app')
  .directive('runnableAddTab', RunnableAddTab);
/**
 * @ngInject
 */
function RunnableAddTab (
  helperAddTab
) {
  return {
    restrict: 'E',
    templateUrl: 'viewAddTab',
    replace: true,
    scope: {
      openItems: '='
    },
    link: function ($scope, elem, attrs) {
      $scope.popoverAddTab = helperAddTab(null, $scope.openItems);
    }
  };
}
