'use strict';

require('app')
  .directive('addTab', addTab);
/**
 * @ngInject
 */
function addTab(
  helperAddTab,
  $state
) {
  return {
    restrict: 'A',
    templateUrl: 'viewAddTab',
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
            envVars: true,
            buildStream: true
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
