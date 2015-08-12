'use strict';

require('app')
  .directive('repositoryDetailsModal', repositoryDetailsModal);
/**
 * directive repositoryDetailsModal
 * @ngInject
 */
function repositoryDetailsModal(
) {
  return {
    restrict: 'A',
    templateUrl: 'repositoryDetailsModalView',
    controller: 'RepositoryDetailsModalController',
    controllerAs: 'RDMC',
    bindToController: true,
    scope: {
      appCodeVersion: '=currentModel',
      defaultActions: '=',
      instance: '=data'
    }
  };
}
