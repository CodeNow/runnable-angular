require('app')
  .controller('ControllerInstance', ControllerInstance);
/**
 * @ngInject
 */
function ControllerInstance(
  async,
  determineActiveAccount,
  keypather,
  OpenItems,
  QueryAssist,
  $scope,
  $state,
  $log,
  $stateParams,
  exists,
  user
) {
  var containerWatch;
  var dataInstance = $scope.dataInstance = {
    data: {},
    actions: {}
  };
  var data = dataInstance.data;
  var actions = dataInstance.actions;

  data.openItems = new OpenItems();

  // shows/hides the file menu
  data.showExplorer = false;
  // loader if saving fs changes
  data.saving = false;

  data.sectionClasses = {
    // out shows/hides entire toolbar
    out: true,
    // in shows/hides file-menu
    in: false
  };

  // watch showExplorer (toggle when user clicks file menu)
  // if no running container, return early (user shouldn't be able to even click
  // button in this situation)
  $scope.$watch('dataInstance.data.showExplorer', function(n, p) {
    var runningContainer = keypather.get(data, 'instance.containers.models[0].running()');
    if (!runningContainer) {
      return;
    }
    data.sectionClasses.in = n;
  });

  // watch for deployed/started/stopped instance
  // all watches necessary, updateDisplayedTabs expectst to be invoked
  // after fetching instance, fetching container, and cointainer start
  $scope.$watch('dataInstance.data.instance.containers.models[0].running()', displayTabsForContainerState);
  $scope.$watch('dataInstance.data.instance', function(n) {
    if (!n) { return; }
    displayTabsForContainerState(keypather.get(dataInstance.data, 'instance.containers.models[0].running()'));
  });

  async.waterfall([
    determineActiveAccount,
    function (activeAccount, cb) {
      data.activeAccount = activeAccount;
      $scope.safeApply();
      cb();
    },
    fetchUser,
    fetchInstance
  ], function(err) {
    if (err) throw err;
    fetchInstances(angular.noop);
  });

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


  // This is to fetch the list of instances.  This is separate so the page can load quickly
  // since it will have its instance.  Only the modals use this list
  function fetchInstances(cb) {
    new QueryAssist(data.user, cb)
      .wrapFunc('fetchInstances', cb)
      .query({
        githubUsername: $stateParams.userName
      })
      .cacheFetch(function (instances, cached, cb) {
        if (!cached && instances.models.length === 0) {
          throw new Error('instance not found');
        }
        data.instances = instances;
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, instances, cb) {
        if (err) { return $log.error(err); }
        data.instances = instances;
        $scope.safeApply();
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
        data.instance.state = {};
        $scope.safeApply();
        cb(null, instance);
      })
      .resolve(function (err, instances, cb) {
        if (!instances.models.length) {
          return cb(new Error('Instance not found'));
        }
        if (err) throw err;
        var instance = instances.models[0];
        data.instance = instance;
        data.instance.state = {};
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
  function displayTabsForContainerState (containerRunning) {
    data.openItems.reset([]);
    if (!exists(containerRunning)) {
      buildLogsOnly();
    }
    var container = keypather.get(dataInstance, 'data.instance.containers.models[0]');
    if (!container) {
      // minor nit fix: build logs flash before box logs if container is not running
      containerWatch = $scope.$watch('dataInstance.data.instance.containers.models[0]', watchForContainerBeforeDisplayTabs);
      return;
    }
    else if (containerRunning === false) {
      boxLogsOnly();
    }
    else if (containerRunning === true) {
      restoreOrOpenDefaultTabs();
    }
  }

  function watchForContainerBeforeDisplayTabs (container) {
    containerWatch();
    if (!container) { return; }
    displayTabsForContainerState(keypather.get(container, 'running()'));
  }

  function buildLogsOnly () {
    // Set to true if we see the instance in an undeployed state
    // DOM will have message when instance w/ containers fetched
    data.showFinishMessageWhenContainerFetched = true;
    // instance not deployed yet
    if (!data.openItems.hasOpen('BuildStream')) {
      data.openItems.addBuildStream();
    }
    return;
  }

  function boxLogsOnly () {
    data.showExplorer = false;
    data.sectionClasses = {
      out: true,
      in: false
    };
    if (data.openItems.hasOpen('LogView')) {
      // make it selected
      var logView = data.openItems.find(function (m) {
        return m.constructor.name === 'LogView';
      });
      data.openItems.activeHistory.add(logView);
    } else {
      // add it
      data.openItems.addLogs();
    }
  }

  function restoreOrOpenDefaultTabs () {
    data.sectionClasses = {
      out: false,
      in: false
    };
    if (!data.openItems.hasOpen('BuildStream')) {
      data.openItems.addBuildStream();
    }
    if (!data.openItems.hasOpen('Terminal')) {
      data.openItems.addTerminal();
    }
    if (!data.openItems.hasOpen('LogView')) {
      data.openItems.addLogs();
    }
    if (!data.openItems.hasOpen('WebView')) {
      data.openItems.addWebView();
    }
    data.openItems.restoreTabs(
      data.instance.id() + '-' + data.instance.build.id(),
      data.instance.containers.models[0]);
    data.openItems.restoreActiveTab();
  }
}
