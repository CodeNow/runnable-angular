'use strict';

require('app')
  .directive('modalIntegrations', modalIntegrations);
/**
 * directive modalIntegrations
 * @ngInject
 */
function modalIntegrations(
  $localStorage,
  keypather
) {
  return {
    restrict: 'A',
    templateUrl: 'viewModalIntegrations',
    scope: {
      actions: '=',
      data: '=',
      defaultActions: '='
    },
    link: function ($scope, element, attrs) {
    }
  };
}