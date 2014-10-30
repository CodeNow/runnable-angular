require('app')
  .controller('ControllerInstance', ControllerInstance);
/**
 * @ngInject
 */
function ControllerInstance(
  async,
  determineActiveAccount,
  helperFetchInstanceDeployStatus,
  keypather,
  QueryAssist,
  OpenItems,
  $scope,
  $state,
  $stateParams,
  user
) {

  var dataInstance = $scope.dataInstance = {
    data: {},
    actions: {}
  };
  var data = dataInstance.data;
  var actions = dataInstance.actions;

  data.openItems = new OpenItems();

  // displays message saying build has completed
  // data.showBuildCompleted = false;

  // loader if saving fs changes
  data.saving = false;

  // toggle explorer menu
  data.showExplorer = false;

  // returns class(s) for section.views-with-add-tab
  // depending on various conditions. Classes control
  // presence of tabs-bar
  actions.getSectionViewsClass = function () {
    var instance = keypather.get(data, 'instance');
    var container = keypather.get(data, 'instance.containers.models[0]');
    if (!instance || !container || !container.running()) {
      return {
        out: true
      };
    }
    if (dataInstance.data.showExplorer) {
      return {
        in: true
      };
    }
  };

  // Redirect to /new if this build has already been built
  function fetchUser(cb) {
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
        var instance = instances.models[0];
        data.instance = instance;
        $scope.safeApply();
      })
      .resolve(function (err, instances, cb) {
        if (!instances.models.length) {
          return cb(new Error('Instance not found'));
        }
        if (err) throw err;
        var instance = instances.models[0];
        data.instance = instance;
        $scope.safeApply();
        cb(null, instance);
      })
      .go();
  }

  // If instance:
  //   !deployed (includes time when building, and short time after building completes before containers initiated)
  //     - hide explorer
  //     - display build logs
  //   deployed && stopped
  //     - hide explorer
  //     - display box logs
  //   deployed && running
  //     - show explorer
  //     - show terminal
  //     - show box logs (has focus)
  function calculateInstanceDisplayState(instance, cb) {

  }

  // watch for deployed instance
  $scope.$watch('dataInstance.data.instance.containers.models[0]', function (container) {
    console.log('p1', container);
    if (!container) return;
    var instance = $scope.dataInstance.data.instance;
  });

  async.waterfall([
    determineActiveAccount,
    function (activeAccount, cb) {
      data.activeAccount = activeAccount;
      $scope.safeApply();
      cb();
    },
    fetchUser,
    fetchInstance,
    helperFetchInstanceDeployStatus
  ]);








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
  // property controlled by directiveEnvVars
  $scope.$watch('dataInstance.data.instance.state.env', function (newEnvVal, oldEnvVal) {
    data.envValidation = validateEnvVars(newEnvVal);
  });
  */
}
