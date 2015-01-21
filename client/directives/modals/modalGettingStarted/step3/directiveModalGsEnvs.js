'use strict';

require('app')
  .directive('modalGsEnvs', modalGsEnvs);
/**
 * @ngInject
 */
function modalGsEnvs(
) {
  return {
    restrict: 'A',
    templateUrl: 'viewModalGsEnvs',
    scope: {
      actions: '=',
      data: '=',
      state: '='
    },
    link: function ($scope, elem, attrs) {
    }
  };
}
