'use strict';

require('app')
  .controller('ControllerInstance', ControllerInstance);
/**
 * @ngInject
 */
function ControllerInstance(
  $filter,
  errs,
  fetchCommitData,
  keypather,
  OpenItems,
  $rootScope,
  $localStorage,
  $location,
  $scope,
  $state,
  $stateParams,
  $timeout,
  $window,
  pFetchUser,
  fetchInstances
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
  data.showExplorer = true;
  // loader if saving fs changes
  data.saving = false;

  data.sectionClasses = {
    // out shows/hides entire toolbar
    out: true,
    // in shows/hides file-menu
    in: false
  };

  data.isDemo = $state.$current.name === 'demo.instance';

  // Trigger Heap event
  if ($window.heap && $location.search('chat')) {
    $window.heap.track('instance-chat-click', {
      type: $location.search('chat')
    });
    // Remove query so copypasta doesn't interfere
    $location.search('chat', null);
  }

  pFetchUser().then(function (user) {
    $scope.user = user;
    return fetchInstances({
      name: $stateParams.instanceName
    });
  })
  .then(function(instance) {
    data.instance = instance;
    keypather.set(
      $localStorage,
      'lastInstancePerUser.' + $stateParams.userName,
      $stateParams.instanceName
    );
    // if nothing has been saved to the uiState object for the user, they're new, so
    // open the file explorer
    if (!keypather.get($scope.user, 'attrs.userOptions.uiState')) {
      data.showExplorer = true;
    }
  })
  .catch(function(err) {
    keypather.set(
      $localStorage,
      'lastInstancePerUser.' + $stateParams.userName,
      null
    );
    data.instance.state = {};
    $state.go('instance.home', {
      userName: $stateParams.userName
    });
    errs.handler(err);
  });

  $scope.$on('new-build', function() {
    if (data.showUpdatingMessage) { return; } // Remove this line on ws change
    data.showUpdatedMessage = false;
    data.showUpdatingMessage = true;
    data.instance.fetch(function(err, json) {
      if (err) { return errs.handler(err); }
      data.commit = fetchCommitData.activeCommit(data.instance.contextVersion.appCodeVersions.models[0]);
      data.showUpdatingMessage = false;
      data.showUpdatedMessage = true;

      if (!data.instance.build.attrs.completed) {
        $timeout(function () {
          data.openItems.addBuildStream();
        });
      }
    });
  });


  // watch showExplorer (toggle when user clicks file menu)
  // if no running container, return early (user shouldn't be able to even click
  // button in this situation)
  $scope.$watch('dataInstance.data.showExplorer', function (n) {
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

  var unwatchRunning;
  function handleContainer (container) {
    if (!container) {
      buildLogsOnly();
    }
    else { // handles both container.error and container.dockerContainer states
      if (unwatchRunning) {
        unwatchRunning();
      }
      unwatchRunning = $scope.$watchCollection(
        'dataInstance.data.instance.containers.models[0].attrs.inspect.State',
        displayTabsForContainerState
      ); // once
    }
  }
  function displayTabsForContainerState (containerState) {
    console.log('INSTANCE STATE: ', containerState);
    if (!containerState) { return; }
    if (!containerState.Running) { // false or null (container.error)
      boxLogsOnly();
    }
    else {
      data.sectionClasses.in = data.showExplorer;
      restoreOrOpenDefaultTabs();
    }
  }

  $scope.$on('$destroy', function () {
    containerWatch();
  });

  function buildLogsOnly () {
    data.sectionClasses = {
      out: true,
      in: false
    };
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
    data.sectionClasses.out = false;
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
    data.openItems.restoreTabs({
        instanceId: data.instance.id(),
        buildId: data.instance.build.id()
      },
      data.instance.containers.models[0]);
    data.openItems.restoreActiveTab();
  }
}
