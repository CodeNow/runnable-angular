'use strict';

require('app')
  .controller('ControllerInstance', ControllerInstance);
/**
 * @ngInject
 */
function ControllerInstance(
  $localStorage,
  $location,
  $q,
  $scope,
  $state,
  $stateParams,
  $timeout,
  $window,
  OpenItems,
  errs,
  eventTracking,
  favico,
  fetchCommitData,
  fetchInstances,
  fetchSettings,
  keypather,
  pFetchUser,
  pageName,
  setLastInstance
) {
  var dataInstance = $scope.dataInstance = {
    data: {
      unsavedAcvs: []
    },
    actions: {}
  };
  var data = dataInstance.data;
  $scope.$storage = $localStorage;
  $scope.dataApp.data.loading = true;

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

  data.userIsOrg = function () {
    return $scope.user.oauthName() !== $state.params.userName;
  };

  // Trigger Heap event
  if ($window.heap && $location.search().chat) {
    $window.heap.track('box-selection-chat-click', {
      type: $location.search().chat
    });
    // Remove query so copypasta doesn't interfere
    $location.search('chat', '');
  }

  // The error handling for pFetchUser will re-direct for us, so we don't need to handle that case
  pFetchUser().then(function (user) {
    $scope.user = user;
    // product team - track visits to instance page & referrer
    eventTracking.boot(user).visitedState();
    return $q.all({
      instance: fetchInstances({ name: $stateParams.instanceName }),
      settings: fetchSettings()
    })
    .then(function (results) {
      var instance = results.instance;
      data.instance = instance;
      pageName.setTitle(instance.attrs.name);
      data.instance.state = {};

      data.hasToken = keypather.get(results, 'settings.attrs.notifications.slack.apiToken');
      setLastInstance($stateParams.instanceName);
      $scope.dataApp.data.loading = false;
    })
    .catch(function (err) { // We ONLY want to handle errors related to fetching instances so this catch is nested.
      errs.handler(err);
      $scope.dataApp.data.loading = false;
      setLastInstance(false);
      $state.go('instance.home', {
        userName: $stateParams.userName
      });
    });
  });

  $scope.$watch('dataInstance.data.instance.build.attrs.started', function (n, p) {
    if (data.showUpdatingMessage || !n || !p || n === p) { return; }

    // If the build was triggered by me manually we don't want to show toasters.
    var isManual = $scope.dataInstance.data.instance.contextVersion.attrs.build.triggeredAction.manual;
    var isTriggeredByMe = $scope.dataInstance.data.instance.contextVersion.attrs.build.triggeredBy.github === $scope.user.oauthId();

    if (isManual && isTriggeredByMe){
      data.showUpdatedMessage = false;
      data.showUpdatingMessage = false;
      return;
    }


    data.showUpdatedMessage = false;
    data.showUpdatingMessage = true;
  });
  $scope.$watch('dataInstance.data.instance.build.attrs.completed', function (n, p) {
    // p should be null since during a build, the completed field is nulled out
    if (!data.showUpdatingMessage || data.showUpdatedMessage || !n || p) { return; }

    // If the build was triggered by me manually we don't want to show toasters.
    var isManual = $scope.dataInstance.data.instance.contextVersion.attrs.build.triggeredAction.manual;
    var isTriggeredByMe = $scope.dataInstance.data.instance.contextVersion.attrs.build.triggeredBy.github === $scope.user.oauthId();

    if (isManual && isTriggeredByMe){
      data.showUpdatedMessage = false;
      data.showUpdatingMessage = false;
      return;
    }

    if (data.instance.contextVersion.appCodeVersions.models.length) {
      data.commit = fetchCommitData.activeCommit(data.instance.contextVersion.appCodeVersions.models[0]);
    }
    data.showUpdatingMessage = false;
    data.showUpdatedMessage = true;
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

  function checkContainerState() {
    var container = keypather.get($scope, 'dataInstance.data.instance.containers.models[0]');
    if (!container) {
      if (keypather.get($scope, 'dataInstance.data.instance.build')) {
        var completed = keypather.get($scope, 'dataInstance.data.instance.build.attrs.completed');
        container = {
          Building: (keypather.get($scope, 'dataInstance.data.instance.build.attrs.started'))
        };
      }
    } else {
      container = container.attrs;
    }
    return container;
  }
  $scope.$watch(checkContainerState, displayTabsForContainerState, true);

  function displayTabsForContainerState(containerState) {
    $timeout(function () {
      favico.setInstanceState(keypather.get($scope, 'dataInstance.data.instance'));
    });
    if (!containerState) {
      return;
    } else if (containerState.Building) {
      buildLogsOnly();
    } else {
      if (keypather.get(containerState, 'inspect.State.Running')) {
        data.sectionClasses.in = data.showExplorer;
        restoreOrOpenDefaultTabs();
      } else {
        boxLogsOnly();
      }
    }
  }

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
    data.openItems.restoreTabs({
        instanceId: data.instance.id(),
        buildId: data.instance.build.id()
      },
      data.instance.containers.models[0]);
    data.openItems.restoreActiveTab();
  }
}
