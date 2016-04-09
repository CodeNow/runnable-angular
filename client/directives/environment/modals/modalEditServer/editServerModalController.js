'use strict';

require('app')
  .controller('EditServerModalController', EditServerModalController);

/**
 * @ngInject
 */
function EditServerModalController(
  $scope,
  $controller,
  $rootScope,
  errs,
  fetchInstancesByPod,
  findLinkedServerVariables,
  keypather,
  loading,
  OpenItems,
  loadingPromises,
  helpCards,
  tab,
  updateDockerfileFromState,
  instance,
  close
) {
  var SMC = this;
  SMC.helpCards = helpCards;

  var parentController = $controller('ServerModalController as SMC', { $scope: $scope });
  angular.extend(SMC, {
    'closeWithConfirmation': parentController.closeWithConfirmation.bind(SMC),
    'changeTab': parentController.changeTab.bind(SMC),
    'insertHostName': parentController.insertHostName.bind(SMC),
    'isDirty': parentController.isDirty.bind(SMC),
    'getNumberOfOpenTabs': parentController.getNumberOfOpenTabs.bind(SMC),
    'getUpdatePromise': parentController.getUpdatePromise.bind(SMC),
    'openDockerfile': parentController.openDockerfile.bind(SMC),
    'populateStateFromData': parentController.populateStateFromData.bind(SMC),
    'rebuildAndOrRedeploy': parentController.rebuildAndOrRedeploy.bind(SMC),
    'requiresRebuild': parentController.requiresRebuild.bind(SMC),
    'requiresRedeploy': parentController.requiresRedeploy.bind(SMC),
    'resetStateContextVersion': parentController.resetStateContextVersion.bind(SMC),
    'saveInstanceAndRefreshCards': parentController.saveInstanceAndRefreshCards.bind(SMC),
    'updateInstanceAndReset': parentController.updateInstanceAndReset.bind(SMC),
    'TAB_VISIBILITY': parentController.TAB_VISIBILITY
  });

  SMC.instance = instance;
  SMC.selectedTab = tab;
  angular.extend(SMC, {
    name: 'editServerModal',
    showDebugCmd: false,
    page: 'build',
    data: {},
    state:  {
      ports: [],
      opts: {
        env: keypather.get(instance, 'attrs.env') || [],
        ipWhitelist: angular.copy(keypather.get(instance, 'attrs.ipWhitelist')) || {
          enabled: false
        }
      },
      promises: {},
      instance: instance,
      newLink: {},
      whitelist: [
        {address: ['1.1.1.1', '1.1.1.10'], description: ''},
        {address: ['1.1.1.3'], description: 'Test'},
        {address: ['1.1.1.9'], description: 'Runnable'},
        {address: ['1.1.1.4', '1.1.1.5'], description: ''}
      ]
    },
    validation: {
      env: null
    },
    openItems: new OpenItems(),
    startCommand: function () {
      var cmd = keypather.get(SMC, 'instance.containers.models[0].attrs.inspect.Config.Cmd[2]');
      cmd = cmd || '';
      return cmd.replace('until grep -q ethwe /proc/net/dev; do sleep 1; done;', '');
    },
    actions: {
      close: SMC.closeWithConfirmation.bind(SMC, close)
    },
    build: instance.build,
    getElasticHostname: instance.getElasticHostname.bind(instance),
    getDisplayName: instance.getDisplayName.bind(instance)
  });
  SMC.modalActions = SMC.actions;
  loading.reset(SMC.name);
  loading(SMC.name, true);

  loadingPromises.clear(SMC.name);
  loading.reset(SMC.name + 'IsBuilding');

  fetchInstancesByPod()
    .then(function (instances) {
      SMC.data.instances = instances;
    });

  $scope.$on('debug-cmd-status', function (evt, status) {
    SMC.showDebugCmd = status;
  });

  $scope.$watchCollection(function () {
    return SMC.state.opts.env;
  }, function (newEnvArray, oldEnvArray) {
    if (!newEnvArray) { return; }
    SMC.linkedEnvResults = findLinkedServerVariables(SMC.state.opts.env);
    if (!angular.equals(newEnvArray, oldEnvArray)) {
      // Only update the Dockerfile if the envs have actually changed
      updateDockerfileFromState(SMC.state, true, true);
    }
  });

  $scope.$on('resetStateContextVersion', function ($event, contextVersion, showSpinner) {
    $event.stopPropagation();
    if (showSpinner) {
      loading(SMC.name, true);
    }
    SMC.resetStateContextVersion(contextVersion, showSpinner)
      .catch(errs.handler)
      .finally(function () {
        if (showSpinner) {
          loading(SMC.name, false);
        }
      });
  });

  function loadInitialState(instance) {
    loading.reset(SMC.name);
    loading(SMC.name, true);
    return SMC.resetStateContextVersion(instance.contextVersion, true)
      .catch(errs.handler)
      .finally(function () {
        loading(SMC.name, false);
      });
  }
  /**
   * This function determines if a tab chooser should be shown
   *
   * Possibilities for currentStatuses are:
   *  advanced
   *  basic
   *  basic + nonRepo (Not used)
   *  advanced + nonRepo
   * @param tabName
   * @returns {*}
   */
  SMC.isTabVisible = function (tabName) {
    if (!SMC.TAB_VISIBILITY[tabName]) {
      return false;
    }
    if (SMC.TAB_VISIBILITY[tabName].featureFlagName && !$rootScope.featureFlags[SMC.TAB_VISIBILITY[tabName].featureFlagName]) {
      return false;
    }
    var currentStatuses = [];
    var currentContextVersion = keypather.get(SMC, 'instance.contextVersion');
    var stateAdvanced = keypather.get(SMC, 'state.advanced');

    if (!currentContextVersion.getMainAppCodeVersion()) {
      return SMC.TAB_VISIBILITY[tabName].nonRepo;
    }
    if (
      stateAdvanced ||
      (
        !keypather.get(SMC, 'state.contextVersion') &&
        keypather.get(currentContextVersion, 'attrs.advanced')
      )
    ) {
      return SMC.TAB_VISIBILITY[tabName].advanced;
    }
    return SMC.TAB_VISIBILITY[tabName].basic;
  };

  SMC.needToBeDirtyToSaved = function () {
    return true;
  };

  SMC.rebuild = function (noCache, forceRebuild) {
    loading(SMC.name, true);
    return SMC.rebuildAndOrRedeploy(noCache, forceRebuild)
      .then(function () {
        return SMC.resetStateContextVersion(SMC.instance.contextVersion, true);
      })
      .then(function (contextVersion) {
        return contextVersion;
      })
      .catch(errs.handler)
      .finally(function () {
        loading(SMC.name, false);
      });
  };

  SMC.isPrimaryButtonDisabled = function (selectedStackInvalid) {
    return (
      !SMC.state.advanced && (SMC.state.selectedStack | selectedStackInvalid)
    );
  };

  loadInitialState(SMC.instance);
}
