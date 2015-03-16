'use strict';

require('app')
  .directive('gsOrganizationSelector', gsOrganizationSelector);
/**
 * @ngInject
 */
function gsOrganizationSelector(
  errs,
  fetchOwnerRepos,
  fetchStackAnalysis,
  hasKeypaths,
  keypather,
  promisify,
  $q,
  $log
) {
  return {
    restrict: 'A',
    templateUrl: 'viewModalOrganizationSelector',
    scope: {
      actions: '=',
      data: '=',
      state: '='
    },
    link: function ($scope, elem, attrs) {
    }
  };
}
