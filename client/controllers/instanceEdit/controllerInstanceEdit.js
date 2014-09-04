require('app')
  .controller('ControllerBoxInstanceEdit', ControllerBoxInstanceEdit);
/**
 * @ngInject
 */
function ControllerBoxInstanceEdit(
  $scope
){
  var QueryAssist = $scope.UTIL.QueryAssist;
  var holdUntilAuth = $scope.UTIL.holdUntilAuth;
  var dataBoxInstanceEdit = $scope.dataBoxInstanceEdit = {};
  var data = dataBoxInstanceEdit.data = {};
  var actions = dataBoxInstanceEdit.actions = {};
}
