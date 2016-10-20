'use strict';

require('app')
  .controller('SetupServerModalController', SetupServerModalController);

function SetupServerModalController(
  $controller,
  $filter,
  $q,
  $rootScope,
  $scope,
  ahaGuide,
  cardInfoTypes,
  createAndBuildNewContainer,
  createBuildFromContextVersionId,
  createDockerfileFromSource,
  dockerfileType,
  errs,
  eventTracking,
  fetchDockerfileFromSource,
  fetchInstancesByPod,
  isTabNameValid,
  keypather,
  loading,
  loadingPromises,
  OpenItems,
  promisify,
  TAB_VISIBILITY,
  updateDockerfileFromState,
  parseDockerfileForDefaults,

  build,
  close,
  defaults,
  instanceName,
  masterBranch,
  repo
) {
  var SMC = this; // Server Modal Controller (shared with EditServerModalController)
  SMC.isAddingFirstRepo = ahaGuide.isAddingFirstRepo;
  SMC.showUrlToolbar = SMC.isAddingFirstRepo();

  var parentController = $controller('ServerModalController as SMC', { $scope: $scope });
  angular.extend(SMC, {
    'changeTab': parentController.changeTab.bind(SMC),
    'closeWithConfirmation': parentController.closeWithConfirmation.bind(SMC),
    'disableMirrorMode': parentController.disableMirrorMode.bind(SMC),
    'enableMirrorMode': parentController.enableMirrorMode.bind(SMC),
    'getContainerUrl': parentController.getContainerUrl.bind(SMC),
    'getDisplayName': parentController.getDisplayName.bind(SMC),
    'getElasticHostname': parentController.getElasticHostname.bind(SMC),
    'getNumberOfOpenTabs': parentController.getNumberOfOpenTabs.bind(SMC),
    'getUpdatePromise': parentController.getUpdatePromise.bind(SMC),
    'handleInstanceUpdate': parentController.handleInstanceUpdate.bind(SMC),
    'hasOpenPorts': parentController.hasOpenPorts.bind(SMC),
    'insertHostName': parentController.insertHostName.bind(SMC),
    'isDirty': parentController.isDirty.bind(SMC),
    'openDockerfile': parentController.openDockerfile.bind(SMC),
    'populateStateFromData': parentController.populateStateFromData.bind(SMC),
    'rebuildAndOrRedeploy': parentController.rebuildAndOrRedeploy.bind(SMC),
    'requiresRebuild': parentController.requiresRebuild.bind(SMC),
    'requiresRedeploy': parentController.requiresRedeploy.bind(SMC),
    'resetStateContextVersion': parentController.resetStateContextVersion.bind(SMC),
    'saveInstanceAndRefreshCards': parentController.saveInstanceAndRefreshCards.bind(SMC),
    'showAdvancedModeConfirm': parentController.showAdvancedModeConfirm.bind(SMC),
    'switchBetweenAdvancedAndMirroring': parentController.switchBetweenAdvancedAndMirroring.bind(SMC),
    'switchToAdvancedMode': parentController.switchToAdvancedMode.bind(SMC),
    'switchToMirrorMode': parentController.switchToMirrorMode.bind(SMC),
    'updateInstanceAndReset': parentController.updateInstanceAndReset.bind(SMC)
  });

  var mainRepoContainerFile = new cardInfoTypes.MainRepository();
  // Set initial state
  angular.extend(SMC, {
    name: 'setupServerModal',
    isLoading: $rootScope.isLoading,
    portsSet: false,
    isNewContainer: true,
    openItems: new OpenItems(),
    state: {
      advanced: false,
      containerFiles: [
        mainRepoContainerFile
      ],
      mainRepoContainerFile: mainRepoContainerFile,
      ports: [],
      packages: new cardInfoTypes.Packages(),
      promises: {},
      opts: {
        masterPod: true,
        name: instanceName,
        env: [],
        ipWhitelist: {
          enabled: false
        },
        isTesting: false
      },
      selectedStack: null,
      step: 1,
      whitelist: [
        {address: ['1.1.1.1', '1.1.1.10'], description: ''},
        {address: ['1.1.1.3'], description: 'Test'},
        {address: ['1.1.1.9'], description: 'Runnable'},
        {address: ['1.1.1.4', '1.1.1.5'], description: ''}
      ]
    },
    actions: {
      close: SMC.closeWithConfirmation.bind(SMC, close)
    },
    data: {},
    selectedTab: 'repository'
  });
  angular.extend(SMC.state, defaults);
  loading.reset(SMC.name);
  loadingPromises.clear(SMC.name);
  loading.reset(SMC.name + 'IsBuilding');

  if (!repo || !build || !masterBranch) {
    return errs.handler(new Error('Repo, build, and masterBranch must be set'));
  }

  // If a repo is passed into this controller, select that repo
  angular.extend(SMC.state, {
    acv: build.contextVersion.getMainAppCodeVersion(),
    advanced: dockerfileType,
    branch: masterBranch,
    build: build,
    contextVersion: build.contextVersion,
    repo: repo,
    repoSelected: true
  });

  // If a stack is already selected, pick it.
  if (SMC.state.selectedStack) {
    loading(SMC.name, true);

    createDockerfileFromSource(SMC.state.contextVersion, SMC.state.selectedStack.key)
      .then(function (dockerfile) {
        SMC.state.dockerfile = dockerfile;
        return fetchDockerfileFromSource(SMC.state.selectedStack.key)
          .then(function (sourceDockerfile) {
            var defaults = parseDockerfileForDefaults(sourceDockerfile, ['run', 'dst']);
            mainRepoContainerFile.commands = defaults.run.map(function (run) {
              return new cardInfoTypes.Command('RUN ' + run);
            });
          });
      })
      .then(function () {
        return updateDockerfileFromState(SMC.state);
      })
      .then(function () {
        return loadAllOptions();
      })
      .then(function () {
        if (SMC.state.step === 3) {
          SMC.changeTab('default');
        }
      })
      .catch(errs.handler)
      .finally(function () {
        loading(SMC.name, false);
      });
  }

  fetchInstancesByPod()
    .then(function (instances) {
      SMC.data.instances = instances;
    });

  // if the blank docker file is chosen, we need to load it because it is already available
  if (dockerfileType === 'blankDockerfile') {
    SMC.openDockerfile({contextVersion: build.contextVersion}, SMC.openItems);
    SMC.changeTab('buildfiles');
  }

  SMC.state.mainRepoContainerFile.name = repo.attrs.name;
  SMC.state.promises.contextVersion = $q.when(SMC.state.contextVersion);

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

  $scope.$watchCollection(function () {
    return SMC.state.ports;
  }, parentController.onPortsChange.bind(SMC));

  $scope.$watchCollection(function () {
    return SMC.state.opts.env;
  }, parentController.onEnvChange.bind(SMC));

  SMC.goToNextStep = function () {
    var nextStepErrorHandler = function (err) {
      SMC.state.step -= 1; // Revert step
      SMC.changeTab(SMC.selectedTab);
      loading(SMC.name, false);
      loading($scope.SMC.name + 'isBuilding',  true);
      errs.handler(err);
    };

    SMC.state.step += 1;
    // Update step in setup-confirm-button directive
    if (SMC.state.step === 2) {
      loading(SMC.name, true);
      loadingPromises.finished(SMC.name) // Wait for the start command to load
        .then(function () {
          SMC.changeTab('commands');
          loading(SMC.name, false);
        })
        .catch(nextStepErrorHandler);
    }
    else if (SMC.state.step === 3) {
      loading(SMC.name, true);
      return loadAllOptions() // When stack is selected, load dockerfile, etc
        .then(function () {
          SMC.changeTab('default');
          loading(SMC.name, false);
        })
        .catch(nextStepErrorHandler);
    }
    else if (SMC.state.step === 4) {
      loading(SMC.name + 'isBuilding',  true);
      return SMC.createServer()
        .then(function () {
          // Go on to step 4 (logs)
          loading(SMC.name + 'isBuilding',  false);
          SMC.changeTab('logs');
        })
        .catch(nextStepErrorHandler);
    }
  };

  function loadPorts () {
    var portsStr = keypather.get(SMC, 'state.selectedStack.ports');
    if (typeof portsStr === 'string') {
      portsStr = portsStr.replace(/,/gi, '');
      var ports = (portsStr || '').split(' ');
      // After initially adding ports here, `ports` can no longer be
      // added/removed since these will be managed by the `ports-form` directive
      // and will get overwritten if a port is added/removed.
      return ports;
    }
    return [];
  }

  function loadAllOptions() {
    if (Array.isArray(SMC.state.ports) && SMC.state.ports.length === 0) {
      SMC.state.ports = loadPorts();
    }
    // Populate ports at when stack has been selected
    return fetchDockerfileFromSource(SMC.state.selectedStack.key)
      .then(function () {
        return updateDockerfileFromState(SMC.state, true, true);
      })
      .then(function () {
        return SMC.openItems.updateAllFiles();
      })
      .then(function () {
        return SMC.openDockerfile(SMC.state, SMC.openItems);
      });
  }

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

  SMC.createServer = function () {
    // Wait until all changes to the context version have been resolved before
    // creating a build with that context version
    var createPromise = loadingPromises.finished(SMC.name)
      .then(function () {
        loadingPromises.clear(SMC.name);
        if (!SMC.state.advanced || SMC.state.advanced === 'blankDockerfile') {
          return updateDockerfileFromState(SMC.state, false, true);
        }
        return true;
      })
      .then(function () {
        if (SMC.state.acv.attrs.branch !== SMC.state.branch.attrs.name) {
          return promisify(SMC.state.acv, 'update')({
            repo: SMC.state.repo.attrs.full_name,
            branch: SMC.state.branch.attrs.name,
            commit: SMC.state.branch.attrs.commit.sha
          });
        }
      })
      .then(function () {
        return SMC.state;
      });
    function instanceSetHandler (instance) {
      if (instance) {
        SMC.instance = instance;
        SMC.state.instance = instance;
        SMC.state.instance.on('update', SMC.handleInstanceUpdate);
        // Reset the opts, in the same way as `EditServerModalController`
        SMC.state.opts  = {
          env: keypather.get(instance, 'attrs.env') || [],
          ipWhitelist: angular.copy(keypather.get(instance, 'attrs.ipWhitelist')) || {
            enabled: false
          },
          isTesting: keypather.get(instance, 'attrs.isTesting') || false
        };
        return instance;
      }
      return $q.reject(new Error('Instance not created properly'));
    }

    // We need to make sure that ports are loaded when the server is created
    if (Array.isArray(SMC.state.ports) && SMC.state.ports.length === 0) {
      SMC.state.ports = loadPorts();
    }

    return SMC.openItems.updateAllFiles()
      .then(function () {
        if (SMC.state.advanced && SMC.state.simpleContextVersionCopy) {
          return createAndBuildNewContainer($q.all({ // This changes the infracodeversion
            build: createBuildFromContextVersionId(SMC.state.simpleContextVersionCopy.id()),
            opts: SMC.state.opts
          }), SMC.state.opts.name, SMC.state.simpleContextVersionCopy)
            .then(instanceSetHandler); // Set instance
        }
        return true;
      })
      .then(function () {
        if (SMC.instance) {
          // Rebuild the build
          return SMC.rebuildAndOrRedeploy(true, true);
        }
        return createAndBuildNewContainer(createPromise, SMC.state.opts.name)
          .then(instanceSetHandler);
      })
      .then(function () {
        eventTracking.createdRepoContainer(SMC.instance.attrs.owner.github, SMC.state.repo.attrs.name);
        return SMC.resetStateContextVersion(SMC.instance.contextVersion, true);
      })
      .catch(function (err) {
        // If creating the server fails, reset the context version
        return SMC.resetStateContextVersion(SMC.state.contextVersion, false)
          .then(function () {
            // Since we failed to build, we need loading promises to have something in it
            loadingPromises.add(SMC.name, $q.when(true));
            return $q.reject(err);
          });
      });
  };

 /**
   * This function determines if a tab chooser should be shown
   *
   * @param tabname
   * @returns {Boolean}
   */
  SMC.isTabVisible = function (tabName) {
    // First, check if tab exists and tab FF is turned on (if applicable)
    if (!isTabNameValid(tabName)) {
      return false;
    }
    if (SMC.state.advanced) {
      if (SMC.state.advanced === 'isMirroringDockerfile') {
        return !!TAB_VISIBILITY[tabName].mirror;
      }
      return !!TAB_VISIBILITY[tabName].advanced;
    }
    return SMC.state.step >= TAB_VISIBILITY[tabName].step;
  };

  SMC.isPrimaryButtonDisabled = function (serverFormInvalid) {
    if (SMC.state.advanced === 'blankDockerfile' || SMC.state.advanced === 'isMirroringDockerfile') {
      return false;
    }
    return (
      (SMC.state.step === 2 && SMC.repositoryForm && SMC.repositoryForm.$invalid) ||
      $filter('selectedStackInvalid')(SMC.state.selectedStack)
    );
  };

  SMC.needsToBeDirtySaved = function () {
    return !!SMC.instance;
  };

  SMC.showStackSelector = function () {
    return !SMC.state.advanced;
  };
}
