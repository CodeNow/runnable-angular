require('app')
  .controller('ControllerInstance', ControllerInstance);
/**
 * @ngInject
 */
function ControllerInstance(
  addTab,
  async,
  determineActiveAccount,
  getNewFileFolderName,
  $interval,
  keypather,
  QueryAssist,
  OpenItems,
  $rootScope,
  $scope,
  $state,
  $stateParams,
  $timeout,
  user,
  validateEnvVars
) {

  var dataInstance = $scope.dataInstance = {data: {}, actions: {}};
  var data = dataInstance.data;
  var actions = dataInstance.actions;

  data.openItems = new OpenItems();
  // displays message saying build has completed
  data.showBuildCompleted = false;
  // loader if saving fs changes
  data.saving = false;

  // Redirect to /new if this build has already been built
  function fetchUser (cb) {
    new QueryAssist(user, cb)
      .wrapFunc('fetchUser')
      .query('me')
      .cacheFetch(function (user, cached, cb) {
        data.user = user;
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, user, cb) {
        if (err) throw err;
        cb();
      })
      .go();
  }

  function fetchInstance(cb) {
    new QueryAssist(data.user, cb)
      .wrapFunc('fetchInstances')
      .query({
        githubUsername: $stateParams.userName,
        name: $stateParams.instanceName
      })
      .cacheFetch(function (instances, cached, cb) {
        if (!cached && !instances.models.length) {
          return cb(new Error('Instance not found'));
        }
        var instance = instances.models[0];
        data.instance = instance;
        $scope.safeApply();
      })
      .resolve(function (err, instances, cb) {
        var instance = instances.models[0];
        if (!keypather.get(instance, 'containers.models') || !instance.containers.models.length) {
          return cb(new Error('instance has no containers'));
        }
        $scope.safeApply();
        cb(err);
      })
      .go();
  }

  async.waterfall([
    determineActiveAccount,
    function (activeAccount, cb) {
      data.activeAccount = activeAccount;
      $scope.safeApply();
      cb();
    },
    fetchUser,
    fetchInstance
  ]);

  /*
  var QueryAssist = $scope.UTIL.QueryAssist;
  var holdUntilAuth = $scope.UTIL.holdUntilAuth;
  var self = ControllerInstance;

  var dataInstance = $scope.dataInstance = self.initData();
  var data = dataInstance.data;
  var actions = dataInstance.actions;

  data.restartOnSave = true;

  function instanceDefaultState (instance) {
    instance.state = {
      name: instance.attrs.name + '-copy'
    };
  }
  */

  /*********************************
   * popoverFileMenu
   *********************************/
  /*
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
  */
  /*********************************
  * popoverGearMenu
  *********************************/
  /*
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
          var instances = $scope.dataInstanceLayout.data.instances.models;
          if (instances.length) {
            $state.go('instance.instance', {
              userName: $state.params.userName,
              instanceName: instances[0].attrs.name
            });
          } else {
            $state.go('instance.new', {
              userName: $state.params.userName
            });
          }
        });
      }
    },

    actionsModalRename: {
      renameInstance: function (cb) {
        if (data.instance.attrs.name === data.instance.state.name.trim()) {
          // no need to make API call if name didn't change
          return;
        }
        pgm.data.show = false;
        // Need class to be removed and
        // re-added
        $timeout(function(){
          data.saving = true;
        }, 1);
        data.saving = false;
        data.instance.update({
          name: data.instance.state.name.trim()
        }, function (err) {
          $scope.safeApply();
          if (err) {
            throw err;
          }
          $state.go('instance.instance', {
            userName: data.instance.attrs.owner.username,
            instanceName: data.instance.attrs.name
          });
        });
        // cb() will reset data.instance.state
        // important to call after PATCH
        cb(); //removes modal
      },
      cancel: function () {
        instanceDefaultState(data.instance);
      }
    },

    forkInstance: function (env) {
      $rootScope.$broadcast('app-document-click');
      $scope.dataApp.data.loading = true;
      var newInstance = data.instance.copy(function (err) {
        if (err) {
          throw err;
        }
        if (env) {
          env = env.map(function (e) {
            return e.key + '=' + e.value;
          });
          newInstance.update({
            name: data.instance.state.name.trim(),
            env: env
          }, function () {
            $state.go('instance.instance', {
              userName: $stateParams.userName,
              instanceName: newInstance.attrs.name
            });
          });
        } else {
          newInstance.update({
            name: data.instance.state.name.trim()
          }, function () {
            $state.go('instance.instance', {
              userName: $stateParams.userName,
              instanceName: newInstance.attrs.name
            });
          });
        }
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

  var dmf = pgm.data.dataModalFork = {};
  var amf = pgm.actions.actionsModalFork = {};
  function asyncInitDataModalFork() {
    dmf.instance = data.instance;
    pgm.instance = data.instance;
    amf.fork = function (env) {
      pgm.actions.forkInstance(env);
    };
  }
  */
  /*********************************
   * popoverAddTab
   *********************************/
  //var pat = data.popoverAddTab = new addTab();

  /*********************************
   * popoverSaveOptions
   *********************************/

  /*
  var pso = data.popoverSaveOptions = {};
  pso.data = {
    dataInstance: $scope.dataInstance
  };
  */

  /***************************************/

  // returns class(s) for section.views-with-add-tab
  // depending on various conditions. Classes control
  // presence of tabs-bar
  /*
  actions.getSectionViewsClass = function () {
    var instance = keypather.get(data, 'instance');
    var container = keypather.get(data, 'container');
    if (!instance || !container) {
      return {
        out: true
      };
    }
    if (dataInstance.data.showExplorer && !dataInstance.data.loading) {
      return {
        in: true
      };
    }
    if (!container.running() || dataInstance.data.loading) {
      return {
        out: true
      };
    }
  };

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
    async.each(
      updateModels,
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
        $scope.safeApply();
      }
    );
  };

  actions.goToBuild = function() {
    var forkedBuild = data.build.deepCopy(function (err) {
      if (err) {
        throw err;
      }
      var state = {
        userName: $state.params.userName,
        instanceName: $state.params.instanceName,
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
  });

  $scope.$watch(function () {
    if (data.openItems && data.openItems.activeFile) {
      return data.openItems.activeFile.attrs.body;
    }
  }, function () {
    //$scope.safeApply();
  });

  // instance is stopped => uncloseable server log
  // instance is building => unclosable build log
  function updateTabs (instanceRunning) {
    if (instanceRunning) {
      // instance is running
      if (data.container.urls().length && !data.openItems.hasOpen('WebView')) {
        pat.actions.addWebView();
      }
      if (!data.openItems.hasOpen('Terminal')) {
        pat.actions.addTerminal();
      }
      pat.actions.addLogs();

      // restore previously active tab user selected
      // on last visit to this instance+build
      data.openItems.restoreActiveTab();

    } else {
      // instance is stopped or building
      if (data.logs) {
        data.logs.state.alwaysOpen = true;
      }
      data.openItems.removeAllButLogs();
      if (!data.instance.build.succeeded()) {
        // instance is building or broken
        var buildStream = pat.actions.addBuildStream();
        buildStream.state.alwaysOpen = true;
      } else {
        pat.actions.addLogs().state.alwaysOpen = true;
      }
    }
    $scope.safeApply();
  }


  var instanceFetchInterval;
  function checkDeploy () {
    // temporary, lightweight check route
    data.instance.deployed(function (err, deployed) {
      if (deployed) {
        // display build completed alert in DOM
        dataInstance.data.showBuildCompleted = true;
        fetchInstance(function (err) {
          if (err) {
            throw err;
          }

          $scope.safeApply();
        });
        $interval.cancel(instanceFetchInterval);
      }
      $scope.safeApply();
    });
  }

  var building;
  // This watch helps us detect if we're loading or building
  $scope.$watch('dataInstance.data.build.attrs.started', function (n, o) {
    if (n && !keypather.get(data, 'build.attrs.completed')) {
      building = true;
    }
  });
  $scope.$watch('dataInstance.data.build.attrs.completed', function (n, o) {
    if (!n) {
      return;
    }
    if (building) {
      building = false;
      instanceFetchInterval = $interval(checkDeploy, 500);
      $scope.dataInstanceLayout.data.showBuildCompleted = false;
    } else {
      // Do we have instructions to show a complete icon on this page
      // from a previous page?
      if ($scope.dataInstanceLayout.data.showBuildCompleted) {
        $scope.dataInstanceLayout.data.showBuildCompleted = false;
        dataInstance.data.showBuildCompleted = true;
      }
    }
  });
  $scope.$watch('dataInstanceLayout.data.instances', function(n) {
    if (n) {
      pgm.data.dataModalRename.instances = n;
      pgm.data.dataModalFork.instances = n;
    }
  });
  */
  /* ============================
   *   API Fetch Methods
   * ===========================*/
  /*
  function fetchInstance(cb) {
    var thisUser = $scope.dataApp.user;
    new QueryAssist(thisUser, cb)
      .wrapFunc('fetchInstances')
      .query({
        githubUsername: $state.params.userName,
        name: $state.params.instanceName
      })
      .cacheFetch(function updateDom(instances, cached, cb) {
        if (!instances.models.length) {
          return cb(new Error('Instance not found'));
        }
        var instance = instances.models[0];
        instanceDefaultState(instance);
        data.instance = instance;
        data.version = data.container = instance.containers.models[0];
        data.build = instance.build;

        // Popovers
        pgm.data.build = data.build;
        pgm.data.container = data.container;
        pgm.data.dataModalRename.instance = instance;
        pgm.data.dataModalDelete.instance = instance;
        pso.data.container = pgm.data.container = data.container;
        asyncInitDataModalFork();
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, instances, cb) {
        var instance = instances.models[0];
        if (!keypather.get(instance, 'containers.models') || !instance.containers.models.length) {
          return cb(new Error('Instance not found'));
        }
        $scope.safeApply();
        cb(err);
      })
      .go();
  }

  function newOpenItems(cb) {
    data.openItems = new OpenItems(data.instance.id() + '-' + data.instance.build.id());
    pat.addOpenItems(data.openItems);
    if (data.build.succeeded()) {
      var container = data.container;

      if (keypather.get(data, 'instance.attrs.env.length')) {
        data.openItems.addEnvVars({
          name: 'Environment'
        }).state.readOnly = true;
      }

      // save this so we can later
      // set it active after adding
      // terminal/web view
      if (!data.openItems.hasOpen('LogView')) {
        data.logs = pat.actions.addLogs();
      } else {
        data.logs = data.openItems.getFirst('LogView');
      }

    } else {
      if (!data.openItems.hasOpen('BuildStream')) {
        data.logs = pat.actions.addBuildStream();
      } else {
        data.logs = data.openItems.getFirst('BuildStream');
      }
    }
    // Watch needs to be fired *after* OpenItems is initalized
    $scope.$watch('dataInstance.data.container.running()', updateTabs, true);
    cb();
  }
  async.waterfall([
    holdUntilAuth,
    fetchInstance,
    newOpenItems
  ], function (err) {
    if (err) {
      $state.go('error', {
        err: err
      });
      throw err;
    }
    $scope.safeApply();
  });
  // Manually cancel the interval
  $scope.$on('$destroy', function () {
    $interval.cancel(instanceFetchInterval);
  });

  // property controlled by directiveEnvVars
  $scope.$watch('dataInstance.data.instance.state.env', function (newEnvVal, oldEnvVal) {
    data.envValidation = validateEnvVars(newEnvVal);
  });
  */
}

/*
ControllerInstance.initData = function () {
  return {
    data: {
      showAddTab: false,
      showFileMenu: false,
      showExplorer: false
    },
    actions: {}
  };
};
*/
