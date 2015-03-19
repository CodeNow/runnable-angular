'use strict';

require('app')
  .directive('setupServers', setupServers);
/**
 * @ngInject
 */
function setupServers(
  keypather
) {
  return {
    restrict: 'A',
    templateUrl: 'viewSetupServers',
    scope: {
      data: '=',
      actions: '=',
      state: '='
    },
    link: function ($scope, elem, attrs) {
    }
  };
}
