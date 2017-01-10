'use strict';

require('app')
  .directive('infrastructureReady', infrastructureReady);
/**
 * @ngInject
 */
function infrastructureReady(
  $document

) {
  return {
    restrict: 'AE',
    controller: 'InfrastructureReadyController',
    controllerAs: 'IRC',
    templateUrl: 'infrastructureReadyView'
  };
}
