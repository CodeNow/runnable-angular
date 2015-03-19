'use strict';

require('app')
  .directive('setupEnvironmentSetup', setupEnvironmentSetup);
/**
 * @ngInject
 */
function setupEnvironmentSetup(
  keypather
) {
  return {
    restrict: 'A',
    templateUrl: 'viewSetupEnvironmentSetup',
    scope: {
      data: '=',
      actions: '=',
      state: '='
    },
    link: function ($scope, elem, attrs) {
    }
  };
}
