'use strict';

require('app')
  .directive('modalEnvironmentVariables', modalEnvironmentVariables);
/**
 * directive modalEnvironmentVariables
 * @ngInject
 */
function modalEnvironmentVariables(
  $localStorage,
  keypather
) {
  return {
    restrict: 'A',
    templateUrl: 'viewModalEnvironmentVariables',
    scope: {
      data: '=',
      currentModel: '=',
      stateModel: '=',
      actions: '=',
      defaultActions: '='
    },
    link: function ($scope, element, attrs) {
    }
  };
}
