require('app')
  .controller('ControllerInstance', ControllerInstance);
/**
 * @ngInject
 */
function ControllerInstance(
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
  var self = ControllerInstance;

  var dataInstance = $scope.dataInstance = self.initData();
  var data = dataInstance.data;
  var actions = dataInstance.actions;

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
    if(!keypather.get(dataInstance, 'data.version.rootDir')) {
      return;
    }
    pfm.data.show = false;
    var dir = dataInstance.data.version.rootDir;
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
  * popoverGearMenu
  *********************************/
  var pgm = data.popoverGearMenu = {};
  pgm.data = {
    show: false,
    // popover contains nested modal
    dataModalDelete: {},
    dataModalRename: {}
  };
  pgm.actions = {
    // popover contains nested modal
    actionsModalDelete: {
      deleteInstance: function () {
        data.instance.destroy(function (err) {
          if (err) {
            throw err;
          }
          $state.go('home');
        });
      }
    },
    actionsModalRename: {
      renameInstance: function (cb) {
        data.instance.update({
          name: data.instance.state.name
        }, function (err) {
          $scope.safeApply();
          cb();
          if (err) {
            throw err;
          }
        });
        $scope.safeApply();
      },
      cancel: function () {
        data.instance.state.name = data.instance.attrs.name;
      }
    },
    forkInstance: function () {
      var newInstance = data.instance.copy(function (err) {
        if (err) {
          throw err;
        }
        $state.go('instance.instance', {
          userName: $stateParams.userName,
          shortHash: newInstance.attrs.shortHash
        });
        // refetch instance collection to update list in
        // instance layout
        var oauthId = $scope.dataInstanceLayout.data.activeAccount.oauthId();
        new QueryAssist($scope.dataApp.user, function () {
          $scope.safeApply();
        })
        .wrapFunc('fetchInstances')
        .query({
          owner: {
            github: oauthId
          }
        })
        .cacheFetch(function (instances, cached, cb) {
          cb();
        })
        .resolve(angular.noop)
        .go();
      });
    }
  };

  pgm.actions.stopInstance = function () {
    data.loading = true;
    pgm.data.show = false;
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

  pgm.actions.startInstance = function () {
    data.loading = true;
    pgm.data.show = false;
    data.instance.start(function (err) {
      if (err) {
        throw err;
      }
      data.instance.fetch(function (err) {
        data.loading = false;
        if (err) {
          throw err;
        }
        console.log(data.instance.containers.models[0].running());
        $scope.safeApply();
      });
    });
  };

  pgm.actions.restartInstance = function () {
    data.loading = true;
    pgm.data.show = false;
    data.instance.restart(function (err) {
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

  /*********************************
   * popoverAddTab
   *********************************/
  var pat = data.popoverAddTab;
  pat.data = {
    show: false
  };
  pat.actions = {};

  pat.actions.addBuildStream = function () {
    pat.data.show = false;
    return data.openItems.addBuildStream({
      name: 'Build Logs'
    });
  };

  pat.actions.addWebView = function () {
    pat.data.show = false;
    return data.openItems.addWebView({
      name: 'Web View'
    });
  };

  pat.actions.addTerminal = function () {
    pat.data.show = false;
    return data.openItems.addTerminal({
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

  /*********************************
   * popoverSaveOptions
   *********************************/

  // What's "isolate" mean?
  var pso = data.popoverSaveOptions = {};
  pso.data = {
    dataInstance: $scope.dataInstance
  };

  /***************************************/

  actions.saveChanges = function () {
    // Trigger a new spinner
    dataInstance.data.saving = false;
    $scope.safeApply(function () {
      dataInstance.data.saving = true;
      $scope.safeApply();
    });
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
        pgm.actions.restartInstance();
      }
    });
  };

  actions.goToBuild = function() {
    var forkedBuild = data.build.deepCopy(function (err) {
      if (err) {
        throw err;
      }
      var state = {
        userName: $state.params.userName,
        shortHash: $state.params.shortHash,
        buildId: forkedBuild.id()
      };
      $state.go('instance.instanceEdit', state);
    });
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


  // instance is stopped => uncloseable server log
  // instance is building => unclosable build log
  $scope.$watch('dataInstance.data.container.running()', function (n) {
    if (!data.openItems) {
      return;
    }
    data.showExplorer = !!n;
    if (n) {
      // instance is running
      if (data.container.urls().length) {
        pat.actions.addWebView();
      }
      pat.actions.addTerminal();
      data.openItems.activeHistory.add(data.logs);
    } else {
      // instance is stopped
      data.logs.state.alwaysOpen = true;
      data.openItems.removeAllButLogs();
      if (!dataInstance.data.instance.build.attrs.completed) {
        // instance is building
        var buildStream = pat.actions.addBuildStream();
        buildStream.state.alwaysOpen = true;
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
          return cb();
          // TODO
          // return $state.go(404);
        }
        instance.state = {
          name: instance.attrs.name + ''
        };
        data.instance = instance;
        data.version = data.container = instance.containers.models[0];
        data.build = instance.build;

        // Popovers
        pgm.data.build = data.build;
        pgm.data.container = data.container;
        pgm.data.dataModalRename.instance = instance;
        pgm.data.dataModalDelete.instance = instance;
        pso.data.container = pgm.data.container = data.container;
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
    if (data.build.succeeded()) {
      var container = data.container;
      // save this so we can later
      // set it active after adding
      // terminal/web view
      data.logs = pat.actions.addLogs();
    } else {
      data.logs = pat.actions.addBuildStream();
    }
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

ControllerInstance.initData = function () {
  return {
    data: {
      popoverAddTab: {
        filter: ''
      },
      showAddTab: false,
      showFileMenu: false,
      showExplorer: false
    },
    actions: {}
  };
};
