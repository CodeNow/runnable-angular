'use strict';

require('app')
  .controller('ControllerInstance', ControllerInstance);
/**
 * @ngInject
 */
function ControllerInstance(
  async,
  $filter,
  errs,
  instanceUpdatedPoller,
  createInstanceDeployedPoller,
  fetchCommitData,
  keypather,
  OpenItems,
  QueryAssist,
  $rootScope,
  $localStorage,
  $location,
  $scope,
  $state,
  $stateParams,
  $timeout,
  $window,
  fetchUser
) {
  var dataInstance = $scope.dataInstance = {
    data: {
      unsavedAcvs: []
    },
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

  data.isDemo = $state.$current.name === 'demo.instance';

  var deployedPoller;

  // Trigger Heap event
  if ($window.heap && $location.search('chat')) {
    $window.heap.track('instance-chat-click', {
      type: $location.search('chat')
    });
    // Remove query so copypasta doesn't interfere
    $location.search('chat', null);
  }

  if (!$stateParams.instanceName) {
    var unwatch = $rootScope.$watch('dataApp.data.instances', function (n, p) {
      if (n !== p && n) {
        unwatch();
        if (n.models.length) {
          var models = $filter('orderBy')(n.models, 'attrs.name');
          $state.go('instance.instance', {
            instanceName: models[0].attrs.name,
            userName: $stateParams.userName
          }, {location: 'replace'});
        } else {
          $state.go('instance.new', {
            userName: $stateParams.userName
          }, {location: 'replace'});
        }
      }
    });
  } else if ($stateParams.instanceName && $stateParams.userName) {
    async.waterfall([
      fetchUser,
      fetchInstance
    ], function (err) {
      if (err) {
        $state.go('instance.home', {
          userName: $stateParams.userName
        });
        errs.handler(err);
      }
      instanceUpdatedPoller.start(data.instance);
    });
  }

  $scope.$on('new-build', function() {
    if (data.showUpdatingMessage) { return; } // Remove this line on ws change
    data.showUpdatedMessage = false;
    data.showUpdatingMessage = true;
    data.instance.fetch(function(err, json) {
      if (err) { return errs.handler(err); }
      data.commit = fetchCommitData.activeCommit(data.instance.contextVersion.appCodeVersions.models[0]);
      data.showUpdatingMessage = false;
      data.showUpdatedMessage = true;
      deployedPoller = createInstanceDeployedPoller(data.instance).start();
    });
  });


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
  // watch for deployed/started/stopped instance
  // all watches necessary, updateDisplayedTabs expectst to be invoked
  // after fetching instance, fetching container, and cointainer start
  var containerWatch =
      $scope.$watch('dataInstance.data.instance.containers.models[0]', handleContainer);

  function handleContainer (container) {
    if (!container) {
      buildLogsOnly();
    }
    else { // handles both container.error and container.dockerContainer states
      $scope.$watch('dataInstance.data.instance.containers.models[0].attrs.inspect.State.Running', displayTabsForContainerState); // once
    }
  }
  function displayTabsForContainerState (containerRunning) {
    if (!containerRunning) { // false or null (container.error)
      boxLogsOnly();
    }
    else {
      restoreOrOpenDefaultTabs();
    }
  }

  function fetchInstance(user, cb) {
    $scope.user = user;
    if ($stateParams.instanceName && $stateParams.userName) {
      new QueryAssist(user, cb)
        .wrapFunc('fetchInstances')
        .query({
          githubUsername: $stateParams.userName,
          name: $stateParams.instanceName
        })
        .cacheFetch(function (instances, cached, cb) {
          data.instance = keypather.get(instances, 'models[0]');
          if (!data.instance) {
            keypather.set(
              $localStorage,
              'lastInstancePerUser.' + $stateParams.userName,
              null
            );
            cb(new Error('Could not find instance on server'));
          } else {
            keypather.set(
              $localStorage,
              'lastInstancePerUser.' + $stateParams.userName,
              $stateParams.instanceName
            );
            data.instance.state = {};
            cb();
          }
        })
        .resolve(function (err) {
          cb(err);
        })
        .go();
    }
  }

  function watchForContainerBeforeDisplayTabs (container) {
    containerWatch();
    if (!container) { return; }
    displayTabsForContainerState(keypather.get(container, 'running()'));
  }

  $scope.$on('$destroy', function () {
    containerWatch();
    instanceUpdatedPoller.stop();
    if (deployedPoller) {
      deployedPoller.clear();
    }
  });

  function buildLogsOnly () {
    data.openItems.reset([]);
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
    data.openItems.reset([]);
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
    data.openItems.reset([]);
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
