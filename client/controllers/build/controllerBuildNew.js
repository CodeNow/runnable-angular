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
  keypather,
  fetcherBuild
) {
  var QueryAssist = $scope.UTIL.QueryAssist;
  var holdUntilAuth = $scope.UTIL.holdUntilAuth;
  var dataBuildNew = $scope.dataBuildNew =  {};
  var actions = dataBuildNew.actions = {};
  var data = dataBuildNew.data = {
    showBuildMenu: false,
    showExplorer: true
  };

  actions.discardChanges = function () {
  };

  actions.stateToBuildList = function () {
    var state = {
      userName: $stateParams.userName,
      projectName: $stateParams.projectName,
      branchName: $stateParams.branchName
    };
    $state.go('projects.buildList', state);
  };

  /* ============================
   *   API Fetch Methods
   * ===========================*/

  function newFilesCollOpenFiles(cb) {
    var version = dataBuildNew.data.version;
    data.openFiles = new SharedFilesCollection(
      version.newFiles([], {
        noStore: true
      }),
      $scope
    );
    cb();
  }

 actions.seriesFetchAll = function () {
    async.series([
      fetcherBuild($scope.dataBuildNew.data),
      newFilesCollOpenFiles
    ], function(){});
  };
  actions.seriesFetchAll();

}
