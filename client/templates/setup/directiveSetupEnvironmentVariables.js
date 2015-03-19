'use strict';

require('app')
  .directive('setupEnvironmentVariables', setupEnvironmentVariables);
/**
 * @ngInject
 */
function setupEnvironmentVariables(
  keypather
) {
  return {
    restrict: 'A',
    templateUrl: 'viewSetupEnvironmentVariables',
    scope: {
      data: '=',
      actions: '=',
      state: '='
    },
    link: function ($scope, elem, attrs) {
    }
  };
}
