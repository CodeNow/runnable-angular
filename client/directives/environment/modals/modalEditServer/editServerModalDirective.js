'use strict';

require('app')
  .directive('editServerModal', editServerModal);
/**
 * @ngInject
 */
function editServerModal(
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
    templateUrl: 'editServerModalView',
    scope: {
      actions: '=',
      data: '=',
      defaultActions: '='
    },
    link: function ($scope, elem, attrs) {


    }
  };
}
