'use strict';

require('app')
  .controller('ControllerError', ControllerError);
/**
 * ControllerBuildList
 * @param $scope
 * @constructor
 * @export
 * @ngInject
 */
function ControllerError(
  $scope,
  $state
) {
  console.log($state.params);
  var dataError = $scope.dataError = $state.params.err;
}
