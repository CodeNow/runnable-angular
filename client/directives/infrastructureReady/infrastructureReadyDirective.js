'use strict';

require('app')
  .directive('infrastructureReady', infrastructureReady);
/**
 * @ngInject
 */
function infrastructureReady(
  $document,
  currentOrg
) {
  return {
    restrict: 'AE',
    controller: 'InfrastructureReadyController',
    controllerAs: 'IRC',
    templateUrl: 'infrastructureReadyView',
    link: function ($scope) {
      $scope.shouldShowInfraReadyView = function () {
        return !currentOrg.poppa.attrs.firstDockCreated;
      };
    }
  };
}
