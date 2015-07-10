'use strict';

require('app')
  .directive('readOnlySwitch', readOnlySwitch);
/**
 * @ngInject
 */
function readOnlySwitch(
) {
  return {
    restrict: 'A',
    templateUrl: 'readOnlySwitchView',
    controller: 'ReadOnlySwitchController',
    controllerAs: 'ROSC'
  };
}
