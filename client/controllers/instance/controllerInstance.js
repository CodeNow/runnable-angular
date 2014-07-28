require('app')
  .controller('ControllerInstance', ControllerInstance);
/**
 * ControllerInstance
 * @constructor
 * @export
 * @ngInject
 */
function ControllerInstance(
  $scope,
  $stateParams,
  async,
  user,
  SharedFilesCollection
) {
  var QueryAssist = $scope.UTIL.QueryAssist;
  var holdUntilAuth = $scope.UTIL.holdUntilAuth;
  var self = ControllerInstance;
  var dataInstance = $scope.dataInstance = self.initData();
  var data = dataInstance.data,
    actions = dataInstance.actions;

  // init
  dataInstance.popoverAddTab = {
    filter: ''
  };

  dataInstance.showAddTab = false;
  dataInstance.showFileMenu = false;

  actions.restartInstance = function () {
    var newInstance = data.instance.restart(function (err) {
      if (err) {
        throw err;
      }
      data.instance = newInstance;
    });
  };

  $scope.$on('app-document-click', function () {
    dataInstance.data.showAddTab = false;
    dataInstance.data.showFileMenu = false;
    dataInstance.data.popoverAddTab.filter = '';
  });

  $scope.$watch(function () {
    if (data.openFiles && data.openFiles.activeFile) {
      return data.openFiles.activeFile.attrs.body;
    }
  }, function () {
    $scope.safeApply();
  });

  /* ============================
   *   API Fetch Methods
   * ===========================*/
  function fetchProject(cb) {
    var thisUser = $scope.dataApp.user;
    new QueryAssist(thisUser, cb)
      .wrapFunc('fetchProjects')
      .query({
        ownerUsername: $stateParams.userName,
        name: $stateParams.projectName
      })
      .cacheFetch(function updateDom(projects, cached, cb) {
        data.project = projects.models[0];
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, projects, cb) {
        if (err) {
          throw err;
        }
        $scope.safeApply();
        cb();
      })
      .go();
  }

  function fetchEnvironment(cb) {
    new QueryAssist(data.project, cb)
      .wrapFunc('fetchEnvironments')
      .query({
        ownerUsername: $stateParams.userName,
        name: $stateParams.branchName
      })
      .cacheFetch(function updateDom(environments, cached, cb) {
        data.environment = environments.models[0];
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, environments, cb) {
        $scope.safeApply();
        cb();
      })
      .go();
  }

  function fetchBuild(cb) {
    new QueryAssist(data.environment, cb)
      .wrapFunc('fetchBuild')
      .query($stateParams.buildName)
      .cacheFetch(function updateDom(build, cached, cb) {
        data.build = build;
        data.version = build.contextVersions.models[0];
        $scope.safeApply();
        if (build.attrs.contextVersions.length){
          cb();
        }
      })
      .resolve(function (err, build, cb) {
        $scope.safeApply();
        cb();
      })
      .go();
  }

  function newFilesCollOpenFiles(cb) {
    var version = data.version;
    data.openFiles = new SharedFilesCollection(
      version.newFiles([], {
        noStore: true
      }),
      $scope
    );
    cb();
  }

  async.waterfall([
    holdUntilAuth,
    fetchProject,
    fetchEnvironment,
    fetchBuild,
    newFilesCollOpenFiles
  ], function() {
    $scope.safeApply();
  });
}

ControllerInstance.initData = function () {
  return {
    data: {
      popoverAddTab: {
        filter: ''
      },
      showAddTab: false,
      showFileMenu: false
    },
    actions: {}
  };
};
