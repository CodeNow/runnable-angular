require('app')
  .controller('ControllerBoxLayout', ControllerBoxLayout);
/**
 * @ngInject
 */
function ControllerBoxLayout(
  $scope
){
  var QueryAssist = $scope.UTIL.QueryAssist;
  var holdUntilAuth = $scope.UTIL.holdUntilAuth;
  var dataBoxLayout = $scope.dataBoxLayout = {};
  var data = dataBoxLayout.data = {};
  var actions = dataBoxLayout.actions = {};
}
