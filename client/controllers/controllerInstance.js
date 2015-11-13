'use strict';

require('app')
  .controller('ControllerInstance', ControllerInstance);
/**
 * @ngInject
 */
function ControllerInstance(
  $localStorage,
  $q,
  $scope,
  $state,
  $stateParams,
  $timeout,
  OpenItems,
  errs,
  eventTracking,
  favico,
  fetchCommitData,
  fetchInstances,
  fetchSettings,
  keypather,
  fetchUser,
  pageName,
  setLastInstance,
  loading
) {
  var dataInstance = $scope.dataInstance = {
    data: {
      unsavedAcvs: []
    },
    actions: {}
  };
  var data = dataInstance.data;
  $scope.$storage = $localStorage;
  loading('main', true);

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

  // The error handling for fetchUser will re-direct for us, so we don't need to handle that case
  fetchUser().then(function (user) {
    $scope.user = user;
    // product team - track visits to instance page & referrer
    console.log('visitedState nope');
    return $q.all({
      instance: fetchInstances({ name: $stateParams.instanceName }, true),
      settings: fetchSettings()
    })
      .then(function (results) {
        var instance = results.instance;
        data.instance = instance;
        pageName.setTitle(instance.attrs.name);
        data.instance.state = {};

        var goHomeOnDestroyHandler = function () {
          $state.go('base.instances', { userName:  $state.params.userName }, {reload: true});
        };
        instance.on('destroyed', goHomeOnDestroyHandler);
        $scope.$on('$destroy', function () {
          instance.off('destroyed', goHomeOnDestroyHandler);
        });


        data.hasToken = keypather.get(results, 'settings.attrs.notifications.slack.apiToken');
        setLastInstance($stateParams.instanceName);
        loading('main', false);
      })
      .catch(function (err) { // We ONLY want to handle errors related to fetching instances so this catch is nested.
        errs.handler(err);
        loading('main', false);
        setLastInstance(false);
        $state.go('base.instances', {
          userName: $stateParams.userName
        }, {reload: true});
      });
  });

  $scope.$watch('dataInstance.data.instance.backgroundContextVersionFinished', function (n, p) {
    // (n !== p) <- Never open this up the first time you arrive on this page
    var unwatchNewCv = angular.noop;
    if (n && n !== p) {
      unwatchNewCv();
      dataInstance.data.instance.backgroundContextVersionFinished = false;
      // If the build was triggered by me manually we don't want to show toasters.
      var isManual = n.triggeredAction.manual;
      var isTriggeredByMe = n.triggeredBy.github === $scope.user.oauthId();

      if (isManual && isTriggeredByMe) {
        data.showUpdatedMessage = false;
        return;
      }
      if (data.instance.contextVersion.getMainAppCodeVersion()) {
        data.commit = fetchCommitData.activeCommit(
          data.instance.contextVersion.getMainAppCodeVersion(),
          keypather.get(n, 'triggeredAction.appCodeVersion.commit')
        );
        var updateBuildHash = n.hash;
        unwatchNewCv = $scope.$watch(function () {
          return keypather.get($scope, 'dataInstance.data.instance.contextVersion.attrs.build.hash') === updateBuildHash &&
            keypather.get($scope, 'dataInstance.data.instance.containers.models[0].running()');
        }, function (n) {
          if (n) {
            unwatchNewCv();
            data.showUpdatingMessage = false;
            data.showUpdatedMessage = true;
          }
        });
      }
    }
  });

  $scope.$watch('dataInstance.data.instance.backgroundContextVersionBuilding', function (n, p) {
    if (n && n !== p) {
      dataInstance.data.instance.backgroundContextVersionBuilding = false;
      // If the build was triggered by me manually we don't want to show toasters.
      var isManual = n.triggeredAction.manual;
      var isTriggeredByMe = n.triggeredBy.github === $scope.user.oauthId();

      if (isManual && isTriggeredByMe) {
        data.showUpdatingMessage = false;
        return;
      }
      if (data.instance.contextVersion.getMainAppCodeVersion()) {
        data.commit = fetchCommitData.activeCommit(
          data.instance.contextVersion.getMainAppCodeVersion(),
          keypather.get(n, 'triggeredAction.appCodeVersion.commit')
        );
        data.showUpdatedMessage = false;
        data.showUpdatingMessage = true;
      }
    }
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

    data.openItems.addBuildStream();
  }

  function boxLogsOnly () {
    data.openItems.reset([]);
    data.showExplorer = false;
    data.sectionClasses = {
      out: true,
      in: false
    };

    data.openItems.addBuildStream();
    data.openItems.addLogs(); // Add this last so that it's selected
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
    data.openItems.restoreTabs(
      { instanceId: data.instance.id() },
      data.instance.containers.models[0]
    );
    data.openItems.restoreActiveTab();
  }
}
