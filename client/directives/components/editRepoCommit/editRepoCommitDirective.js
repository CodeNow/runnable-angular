'use strict';

require('app')
  .directive('editRepoCommit', editRepoCommit);
/**
 * @ngInject
 */
function editRepoCommit(
  $q,
  fetchCommitData,
  keypather,
  promisify,
  errs,
  loading,
  $rootScope,
  ModalService
) {
  return {
    restrict: 'A',
    templateUrl: 'editRepoCommitView',
    controller: 'EditRepoCommitController',
    controllerAs: 'ERCC',
    bindToController: true,
    scope: {
      acv: '= model',
      instance: '=',
      update: '&'
    }
  }
}
