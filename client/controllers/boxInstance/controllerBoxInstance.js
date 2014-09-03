require('app')
  .controller('ControllerBoxInstance', ControllerBoxInstance);
/**
 * @ngInject
 */
function ControllerBoxInstance(
  $scope
){
  var QueryAssist = $scope.UTIL.QueryAssist;
  var holdUntilAuth = $scope.UTIL.holdUntilAuth;
  var dataBoxInstance = $scope.dataBoxInstance = {};
  var data = dataBoxInstance.data = {};
  var actions = dataBoxInstance.actions = {};
}
