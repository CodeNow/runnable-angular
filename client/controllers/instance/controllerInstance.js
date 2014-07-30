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
  $state,
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

  actions.addTerminal = function () {
    data.openFiles.add({
      Key: 'Terminal',
      type: 'terminal',
      path: '/',
      name: Date.now() + '',
      params: data.instance.attrs.containers[0]
    });
    data.showAddTab = false;
  };

  actions.stopInstance = function () {
    data.instance.stop(function (err) {
      if (err) { throw err; }
      data.instance.fetch(function (err) {
        if (err) { throw err; }
        $scope.safeApply();
      });
    });
  };

  actions.startInstance = function () {
    data.instance.start(function (err) {
      if (err) { throw err; }
      data.instance.fetch(function (err) {
        if (err) { throw err; }
        $scope.safeApply();
      });
    });
  };

  actions.stateToBuildList = function (userName, projectName, branchName) {
    var thisUser = $scope.dataApp.user;
    var state = {
      userName: userName,
      projectName: projectName,
      branchName: branchName
    };
    $state.go('projects.buildList', state);
  };

  actions.destroyInstance = function () {
    var old = data.instance.json();
    data.instance.destroy(function (err) {
      if (err) { throw err; }
      actions.stateToBuildList(old.owner.username, old.project.name, old.environment.name);
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

  function fetchInstance (cb) {
    var thisUser = $scope.dataApp.user;
    new QueryAssist(thisUser, cb)
      .wrapFunc('fetchInstance')
      .query($stateParams.instanceId)
      .cacheFetch(function updateDom(instance, cached, cb) {
        if (!instance) {
          return $state.go(404);
        }
        data.instance = instance;
        data.version = data.container = instance.containers.models[0];
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, instance, cb) {
        if (err) {
          throw err;
        }
        $scope.safeApply();
        cb();
      })
      .go();
  }

  function newFilesCollOpenFiles(cb) {
    // tODO fetch container files
    var container = data.container;
    data.openFiles = new SharedFilesCollection(
      container.newFiles([], {
        noStore: true
      }),
      $scope
    );
    cb();
  }

  async.waterfall([
    holdUntilAuth,
    fetchInstance,
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
