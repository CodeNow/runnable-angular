'use strict';

require('app')
  .directive('deleteEnvironment', deleteEnvironment);
/**
 * @ngInject
 */
function deleteEnvironment(
  $rootScope,
  errs,
  ModalService
) {
  return {
    restrict: 'A',
    templateUrl: 'deleteEnvironmentView',
    scope: {
      autoIsolationConfigId: '='
    },
    link: function ($scope, element, attrs) {
      $scope.openDeleteEnvironmentModal = function () {
        $rootScope.$broadcast('close-popovers');
        ModalService.showModal({
          templateUrl: 'deleteEnvironmentsModalView',
          controller: 'DeleteEnvironmentsModalController',
          controllerAs: 'DEMC',
          inputs: {
            autoIsolationConfigId: $scope.autoIsolationConfigId
          }
        })
          .catch(errs.handler);
      };
    }
  };
}
