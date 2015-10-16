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
    isLoadingInitialState: true,
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

  $scope.$on('debug-cmd-status', function (evt, status) {
    SMC.showDebugCmd = status;
  });

  $scope.$watch(function () {
    return SMC.state.opts.env.join();
  }, function (n) {
    if (!n) { return; }
    SMC.linkedEnvResults = findLinkedServerVariables(SMC.state.opts.env);
  });

   $scope.$on('resetStateContextVersion', function ($event, contextVersion, hasNoErrors) {
    $event.stopPropagation();
    loading.reset(SMC.name);
    if (hasNoErrors) {
      loading(SMC.name, true);
    }
    SMC.resetStateContextVersion(contextVersion, !hasNoErrors)
      .catch(errs.handler)
      .finally(function () {
        if (hasNoErrors) {
          loading(SMC.name, false);
        }
      });
  });

  function loadInitialState(instance) {
    loading.reset(SMC.name);
    loading(SMC.name, true);
    return SMC.resetStateContextVersion(instance.contextVersion, false)
      .catch(errs.handler)
      .finally(function () {
        loading(SMC.name, false);
        // After context has been reset, start keeping track of loading promises
        // to check if current state is dirty
        loadingPromises.clear(SMC.name);
        SMC.isLoadingInitialState = false;
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

  SMC.isDockerfileValid = function () {
    if (!SMC.state.advanced || !keypather.get(SMC, 'state.dockerfile.validation.criticals.length')) {
      return true;
    }
    return !SMC.state.dockerfile.validation.criticals.find(hasKeypaths({
      message: 'Missing or misplaced FROM'
    }));
  };

  SMC.getUpdatePromise = function () {
    SMC.saveTriggered = true;
    SMC.isBuilding = true;
    return SMC.saveInstanceAndRefreshCards()
      .then(function () {
        return close();
      })
      .catch(function (err) {
        errs.handler(err);
        return SMC.resetStateContextVersion(SMC.state.contextVersion, true)
          .finally(function () {
            // Only turn off `isBuilding` if there is an error and we have to revert back 
            SMC.isBuilding = false;
          });
      });
  };

  loadInitialState(SMC.instance);
}
