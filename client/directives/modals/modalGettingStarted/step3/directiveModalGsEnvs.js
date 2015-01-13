'use strict';

require('app')
  .directive('modalGsEnvs', modalGsEnvs);
/**
 * @ngInject
 */
function modalGsEnvs(
  async,
  keypather,
  errs,
  fetchGSDepInstances,
  fetchStackInfo,
  fetchUser,
  hasKeypaths,
  $stateParams,
  $timeout,
  QueryAssist
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
