require('app')
  .directive('runnableAddTab', RunnableAddTab);
/**
 * @ngInject
 */
function RunnableAddTab(
  helperAddTab,
  $state
) {
  return {
    restrict: 'E',
    templateUrl: 'viewAddTab',
    replace: true,
    scope: {
      openItems: '='
    },
    link: function ($scope, elem, attrs) {

      var opts = {};

      switch ($state.$current.name) {
      case 'instance.setup':
        opts = {
          envVars: true
        };
        break;
      case 'instance.instanceEdit':
        opts = {
          envVars: true
        };
        break;
      case 'instance.instance':
        opts = {
          envVars: true,
          logs: true,
          buildStream: true,
          terminal: true,
          webView: true
        };
        break;
      }

      $scope.popoverAddTab = helperAddTab(opts, $scope.openItems);

    }
  };
}
