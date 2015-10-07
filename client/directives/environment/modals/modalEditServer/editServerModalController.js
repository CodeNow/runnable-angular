'use strict';

require('app')
  .controller('EditServerModalController', EditServerModalController);

var tabVisibility = {
  buildfiles: { advanced: true, nonRepo: true, basic: false },
  repository:  { advanced: false, nonRepo: false, basic: true },
  ports:  { advanced: false, nonRepo: false, basic: true },
  env:  { advanced: true, nonRepo: true, basic: true },
  commands:  { advanced: false, nonRepo: false, basic: true },
  files:  { advanced: false, nonRepo: false, basic: true },
  translation:  { advanced: true, nonRepo: false, basic: true },
  logs:  { advanced: true, nonRepo: true, basic: true }
};

/**
 * @ngInject
 */
function EditServerModalController(
  $scope,
  $controller,
  $q,
  $filter,
  $rootScope,
  errs,
  eventTracking,
  fetchInstancesByPod,
  fetchStackInfo,
  fetchSourceContexts,
  findLinkedServerVariables,
  hasKeypaths,
  helpCards,
  keypather,
  loading,
  loadingPromises,
  OpenItems,
  promisify,
  updateDockerfileFromState,
  ModalService,
  tab,
  instance,
  actions,
  close
) {
  var SMC = this;

  angular.extend(SMC, $controller('ServerModalController as SMC', { $scope: $scope }));

  SMC.instance = instance;
  SMC.selectedTab = tab;
  angular.extend(SMC, {
    name: 'editServerModal',
    showDebugCmd: false,
    data: {},
    state:  {
      ports: [],
      opts: {
        env: keypather.get(instance, 'attrs.env') || []
      },
      promises: {},
      instance: instance,
      newLink: {}
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
    actions: angular.extend(actions, {
      close: function () {
        $rootScope.$broadcast('close-popovers');
        if (SMC.isDirty() && !SMC.saveTriggered) {
          ModalService.showModal({
            controller: 'ConfirmationModalController',
            controllerAs: 'CMC',
            templateUrl: 'confirmCloseEditServer'
          })
            .then(function (modal) {
              modal.close.then(function (confirmed) {
                if ( confirmed ) {
                  close();
                }
              });
            })
            .catch(errs.handler);
        } else {
          close();
        }
      }
    }),
    build: instance.build,
    getElasticHostname: instance.getElasticHostname.bind(instance)
  });
  SMC.modalActions = SMC.actions;
  loading.reset(SMC.name);
  loading(SMC.name, true);

  fetchInstancesByPod()
    .then(function (instances) {
      SMC.data.instances = instances;
    });

  fetchStackInfo()
    .then(function (stackInfo) {
      SMC.data.stacks = stackInfo;
    });

  fetchSourceContexts()
    .then(function (contexts) {
      SMC.data.sourceContexts = contexts;
    });

  SMC.updateDockerfileFromState = function () {
    // Only update from state if not in advanced mode
    if (!keypather.get(SMC, 'instance.contextVersion.attrs.advanced')) {
      return loadingPromises.add(SMC.name, updateDockerfileFromState(SMC.state));
    }
  };

  $scope.$on('debug-cmd-status', function (evt, status) {
    SMC.showDebugCmd = status;
  });

  $scope.$watch(function () {
    return SMC.state.opts.env.join();
  }, function (n) {
    if (!n) { return; }
    SMC.linkedEnvResults = findLinkedServerVariables(SMC.state.opts.env);
  });

   $scope.$on('resetStateContextVersion', function ($event, contextVersion, showSpinner) {
    $event.stopPropagation();
    SMC.resetStateContextVersion(contextVersion, showSpinner);
  });

  function resetState(instance, fromError) {
    return SMC.resetStateContextVersion(instance.contextVersion, !fromError)
      .then(function () {
        // After context has been reset, start keeping track of loading promises
        // to check if current state is dirty
        loadingPromises.clear(SMC.name);
      });
  }

  SMC.changeTab = function (tabname) {
    if (!SMC.state.advanced) {
      if ($filter('selectedStackInvalid')(SMC.state.selectedStack)) {
        tabname = 'repository';
      } else if (!SMC.state.startCommand) {
        tabname = 'commands';
      }
    } else if ($scope.editServerForm.$invalid) {
      if (keypather.get($scope, 'editServerForm.$error.required.length')) {
        var firstRequiredError = $scope.editServerForm.$error.required[0].$name;
        tabname = firstRequiredError.split('.')[0];
      }
    }
    SMC.selectedTab = tabname;
  };
  /**
   * This function determines if a tab chooser should be shown
   *
   * Possibilities for currentStatuses are:
   *  advanced
   *  basic
   *  basic + nonRepo (Not used)
   *  advanced + nonRepo
   * @param tabname
   * @returns {*}
   */
  SMC.isTabVisible = function (tabname) {
    if (!tabVisibility[tabname]) {
      return false;
    }
    var currentStatuses = [];
    var currentContextVersion = keypather.get(SMC, 'instance.contextVersion');
    var stateAdvanced = keypather.get(SMC, 'state.advanced');

    if (!currentContextVersion.getMainAppCodeVersion()) {
      currentStatuses.push('nonRepo');
    }
    if (stateAdvanced ||
        (!keypather.get(SMC, 'state.contextVersion') && keypather.get(currentContextVersion, 'attrs.advanced'))) {
      currentStatuses.push('advanced');
    } else {
      currentStatuses.push('basic');
    }
    return currentStatuses.every(function (status) {
      return tabVisibility[tabname][status];
    });
  };


  SMC.insertHostName = function (opts) {
    if (!opts) {
      return;
    }
    var hostName = '';
    if (opts.protocol) {
      hostName += opts.protocol;
    }
    if (opts.server) {
      hostName += opts.server.getElasticHostname();
    }
    if (opts.port) {
      hostName += ':' + opts.port;
    }
    $rootScope.$broadcast('eventPasteLinkedInstance', hostName);
  };

  SMC.getUpdatePromise = function () {
    SMC.saveTriggered = true;
    $rootScope.$broadcast('close-popovers');
    SMC.building = true;
    return SMC.rebuildAndOrRedeploy()
     .then(function () {
        helpCards.refreshActiveCard();
        close();
        $rootScope.$broadcast('alert', {
          type: 'success',
          text: 'Container updated successfully.'
        });
      })
      .catch(function (err) {
        errs.handler(err);
        resetState(SMC.state, true)
          .finally(function () {
            SMC.building = false;
          });
      });
  };

  SMC.isDockerfileValid = function () {
    if (!SMC.state.advanced || !keypather.get(SMC, 'state.dockerfile.validation.criticals.length')) {
      return true;
    }
    return !SMC.state.dockerfile.validation.criticals.find(hasKeypaths({
      message: 'Missing or misplaced FROM'
    }));
  };

  resetState(SMC.instance);
}
