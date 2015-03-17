'use strict';

require('app')
  .directive('gsEnvironmentSetup', gsEnvironmentSetup);
/**
 * @ngInject
 */
function gsEnvironmentSetup(
  keypather
) {
  return {
    restrict: 'A',
    templateUrl: 'viewModalEnvironmentSetup',
    scope: {
      data: '=',
      actions: '=',
      state: '='
    },
    link: function ($scope, elem, attrs) {
    }
  };
}
