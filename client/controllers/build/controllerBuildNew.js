require('app')
  .controller('ControllerBuildNew', ControllerBuildNew);
/**
 * ControllerBuildNew
 * @constructor
 * @export
 * @ngInject
 */
function ControllerBuildNew(
  $scope,
  $stateParams,
  $state,
  user,
  async,
  extendDeep,
  SharedFilesCollection,
  keypather
) {
  var QueryAssist = $scope.UTIL.QueryAssist;
  var holdUntilAuth = $scope.UTIL.holdUntilAuth;
  var dataBuildNew = $scope.dataBuildNew =  {};
  var actions = dataBuildNew.actions = {};
  var data = dataBuildNew.data = {};

  actions.stateToBuildList = function () {
    var state = {
      userName: $stateParams.userName,
      projectName: $stateParams.projectName,
      branchName: $stateParams.branchName
    };
    $state.go('projects.buildList', state);
  };

}
