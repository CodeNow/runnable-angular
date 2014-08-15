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
  OpenItems
) {
  var QueryAssist = $scope.UTIL.QueryAssist;
  var holdUntilAuth = $scope.UTIL.holdUntilAuth;

  var dataInstance = $scope.dataInstance = {};
  var data = dataInstance.data = {};
  var actions = dataInstance.actions = {};

  /*********************************
   * popoverFileMenu
   *********************************/
  var pfm = data.popoverFileMenu = {};
  pfm.data = {};
  pfm.data.show = false;
  pfm.actions = {};

  pfm.actions.createFile = function () {};

  pfm.actions.createFolder = function () {};

  /*********************************
   * popoverAddTab
   *********************************/
  var pat = data.popoverAddTab = {};
  pat.data = {};
  pat.data.show = false;
  pat.actions = {};

  pat.actions.addOutputStream = function () {
    pat.data.show = false;
    //TODO
  };

  pat.actions.addWebView = function () {
    pat.data.show = false;
    data.openItems.addWebView({
      name: 'Web View'
    });
  };

  pat.actions.addTerminal = function () {
    pat.data.show = false;
    data.openItems.addTerminal({
      name: 'Terminal',
      params: data.instance.attrs.containers[0]
    });
  };

  pat.actions.addLogs = function () {
    pat.data.show = false;
    data.openItems.addLogs({
      name: 'Server Logs',
      params: data.instance.attrs.containers[0]
    });
  };

  actions.saveChanges = function () {
    
  };

  actions.stopInstance = function () {
    data.instance.stop(function (err) {
      if (err) {
        throw err;
      }
      data.instance.fetch(function (err) {
        if (err) {
          throw err;
        }
        $scope.safeApply();
      });
    });
  };

  actions.startInstance = function () {
    data.instance.start(function (err) {
      if (err) {
        throw err;
      }
      data.instance.fetch(function (err) {
        if (err) {
          throw err;
        }
        $scope.safeApply();
      });
    });
  };

  actions.stateToBuildList = function (userName, projectName, branchName) {
    var state = {
      userName: userName,
      projectName: projectName,
      branchName: branchName
    };
    $state.go('projects.buildList', state);
  };

  actions.goToBuild = function() {
    var attrs = data.instance.attrs;
    var state = {
      userName: attrs.owner.username,
      projectName: attrs.project.name,
      branchName: attrs.environment.name,
      buildName: attrs.build.buildNumber
    };
    $state.go('projects.build', state);
  };

  actions.destroyInstance = function () {
    var old = data.instance.json();
    data.instance.destroy(function (err) {
      if (err) {
        throw err;
      }
      actions.stateToBuildList(old.owner.username, old.project.name, old.environment.name);
    });
  };

  $scope.$on('app-document-click', function () {
    dataInstance.data.showAddTab = false;
    dataInstance.data.showFileMenu = false;
    dataInstance.data.popoverAddTab.filter = '';
  });

  $scope.$watch(function () {
    if (data.openItems && data.openItems.activeFile) {
      return data.openItems.activeFile.attrs.body;
    }
  }, function () {
    $scope.safeApply();
  });

  /* ============================
   *   API Fetch Methods
   * ===========================*/
  function fetchInstance(cb) {
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
        if (!instance || !instance.containers.models.length) {
          return cb(new Error('Instance not found'));
        }
        $scope.safeApply();
        cb(err);
      })
      .go();
  }

  function newOpenItems(cb) {
    data.openItems = new OpenItems();
    var container = data.container;
    if (container && container.urls().length) {
      pat.actions.addWebView();
      pat.actions.addTerminal();
    }
    pat.actions.addLogs();
    cb();
  }

  async.waterfall([
    holdUntilAuth,
    fetchInstance,
    newOpenItems
  ], function (err) {
    if (err) {
      $state.go('404');
      throw err;
    }
    $scope.safeApply();
  });
}
