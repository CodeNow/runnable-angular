require('app')
  .controller('ControllerBoxInstance', ControllerBoxInstance);
/**
 * @ngInject
 */
function ControllerBoxInstance(
  $scope,
  $state,
  $stateParams,
  keypather,
  async,
  user,
  OpenItems,
  getNewFileFolderName
) {
  var QueryAssist = $scope.UTIL.QueryAssist;
  var holdUntilAuth = $scope.UTIL.holdUntilAuth;
  var self = ControllerBoxInstance;

  var dataBoxInstance = $scope.dataBoxInstance = self.initData();
  var data = dataBoxInstance.data;
  var actions = dataBoxInstance.actions;

  data.restartOnSave = true;

  /*********************************
   * popoverFileMenu
   *********************************/
  var pfm = data.popoverFileMenu = {};
  pfm.data = {
    show: false
  };
  pfm.actions = {};

  pfm.actions.create = function (isDir) {
    if(!keypather.get(dataBoxInstance, 'data.version.rootDir')) {
      return;
    }
    pfm.data.show = false;
    var dir = dataBoxInstance.data.version.rootDir;
    var name = getNewFileFolderName(dir);
    var file = dir.contents.create({
      name: name,
      isDir: isDir
    }, function (err) {
      if (err) {
        throw err;
      }
      dir.contents.fetch(function (err) {
        if (err) {
          throw err;
        }
        keypather.set(file, 'state.renaming', true);
        $scope.safeApply();
      });
    });
  };

  /*********************************
   * popoverAddTab
   *********************************/
  var pat = data.popoverAddTab;
  pat.data = {
    show: false
  };
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
    return data.openItems.addLogs({
      name: 'Server Logs',
      params: data.instance.attrs.containers[0]
    });
  };

  actions.saveChanges = function () {
    var updateModels = data.openItems.models
      .filter(function (model) {
        if (typeof keypather.get(model, 'attrs.body') !== 'string') {
          return false;
        }
        return (model.attrs.body !== model.state.body);
      });
    async.each(updateModels,
    function iterate (file, cb) {
      file.update({
        json: {
          body: file.state.body
        }
      }, function (err) {
        if (err) {
          throw err;
        }
        $scope.safeApply();
        cb();
      });
    },
    function complete (err) {
      if (data.restartOnSave) {
        actions.startInstance();
      }
    });
  };

  actions.stopInstance = function () {
    data.loading = true;
    data.instance.stop(function (err) {
      if (err) {
        throw err;
      }
      data.instance.fetch(function (err) {
        data.loading = false;
        if (err) {
          throw err;
        }
        $scope.safeApply();
      });
    });
  };

  actions.startInstance = function () {
    data.loading = true;
    data.instance.start(function (err) {
      if (err) {
        throw err;
      }
      data.instance.fetch(function (err) {
        data.loading = false;
        if (err) {
          throw err;
        }
        $scope.safeApply();
      });
    });
  };

  // actions.stateToBuildList = function (userName, projectName, branchName) {
  //   var state = {
  //     userName: userName,
  //     projectName: projectName,
  //     branchName: branchName
  //   };
  //   $state.go('projects.buildList', state);
  // };

  actions.goToBuild = function() {
    var attrs = data.instance.attrs;
    var state = {
      userName: $state.params.userName,
      shortHash: $state.params.shortHash,
      buildId: data.instance.attrs.build.id
    };
    $state.go('projects.boxInstanceEdit', state);
  };

  actions.destroyInstance = function () {
    var old = data.instance.json();
    data.instance.destroy(function (err) {
      $scope.safeApply();
      if (err) {
        throw err;
      }
    });
    $scope.safeApply();
    actions.stateToBuildList(old.owner.username, old.project.name, old.environment.name);
  };

  actions.renameInstance = function () {
    data.instance.update({
      name: data.instance.attrs.name
    }, function (err) {
      $scope.safeApply();
      if (err) {
        throw err;
      }
    });
    $scope.safeApply();
  };

  $scope.$on('app-document-click', function () {
    dataBoxInstance.data.showAddTab = false;
    dataBoxInstance.data.showFileMenu = false;
    dataBoxInstance.data.popoverAddTab.filter = '';
  });

  $scope.$watch(function () {
    if (data.openItems && data.openItems.activeFile) {
      return data.openItems.activeFile.attrs.body;
    }
  }, function () {
    $scope.safeApply();
  });

  $scope.$watch('dataBoxInstance.data.container.running()', function (n) {
    if (data.openItems) {
      if (n) {
        if (data.container.urls().length) {
          pat.actions.addWebView();
        }
        data.showExplorer = true;
        pat.actions.addTerminal();
        data.openItems.activeHistory.add(data.logs);
      } else {
        data.showExplorer = false;
        data.openItems.removeAllButLogs();
      }
    }
  }, true);

  /* ============================
   *   API Fetch Methods
   * ===========================*/
  function fetchInstance(cb) {
    var thisUser = $scope.dataApp.user;
    new QueryAssist(thisUser, cb)
      .wrapFunc('fetchInstance')
      .query($stateParams.shortHash)
      .cacheFetch(function updateDom(instance, cached, cb) {
        if (!instance) {
          return;
          // TODO
          // return $state.go(404);
        }
        data.instance = instance;
        data.version = data.container = instance.containers.models[0];
        if (data.container && data.container.running()) {
          data.showExplorer = true;
        } else {
          data.showExplorer = false;
        }
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, instance, cb) {
        if (!keypather.get(instance, 'containers.models') || !instance.containers.models.length) {
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
    // save this so we can later set it active after adding terminal/web view
    data.logs = pat.actions.addLogs();
    cb();
  }

  async.waterfall([
    holdUntilAuth,
    fetchInstance,
    newOpenItems
  ], function (err) {
    if (err) {
      // $state.go('404');
      throw err;
    }
    $scope.safeApply();
  });
}

ControllerBoxInstance.initData = function () {
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
