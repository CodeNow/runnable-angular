'use strict';

require('app')
  .controller('SetupServerModalController', SetupServerModalController);

var tabVisibility = {
  buildfiles: { advanced: true, step: 3 },
  repository:  { advanced: false, step: 1 },
  whitelist:  { advanced: true, step: 3, featureFlagName: 'whitelist' },
  ports:  { advanced: false, step: 3 },
  env:  { advanced: true, step: 3 },
  commands:  { advanced: false, step: 2 },
  files:  { advanced: false, step: 3 },
  translation:  { advanced: true, step: 3 },
  logs:  { advanced: true, step: 4 },
};

function SetupServerModalController(
  $scope,
  $controller,
  $filter,
  $q,
  $rootScope,
  createNewBuild,
  createAndBuildNewContainer,
  createBuildFromContextVersionId,
  errs,
  eventTracking,
  fetchDockerfileFromSource,
  fetchInstancesByPod,
  fetchOwnerRepos,
  fetchStackAnalysis,
  fetchStackData,
  fetchUser,
  hasKeypaths,
  helpCards,
  keypather,
  loading,
  loadingPromises,
  promisify,
  updateDockerfileFromState,
  $log,
  cardInfoTypes,
  OpenItems,
  fetchStackInfo,
  close,
  repo,
  build,
  masterBranch
) {
  var SMC = this; // Server Modal Controller (shared with EditServerModalController)
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
    getDisplayName: function () {
      if (SMC.instance) {
        return SMC.instance.getDisplayName();
      }
      return SMC.state.repo.attrs.name;
    },
    getElasticHostname: function () {
      if (keypather.get(SMC, 'state.repo.attrs')) {
        // NOTE: Is SMC the best way to get the hostname?
        var repo = SMC.state.repo;
        var repoName = repo.attrs.name;
        var repoOwner = repo.attrs.owner.login.toLowerCase();
        var domain = SMC.state.repo.opts.userContentDomain;
        // NOTE: How can I know whether it will be staging or not?
        var hostname = repoName + '-staging-' + repoOwner + '.' + domain;
        return hostname;
      }
      return '';
    },
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
        name: '',
        env: [],
        ipWhitelist: {
          enabled: false
        }
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
  loading.reset(SMC.name);
  loadingPromises.clear(SMC.name);
  loading.reset(SMC.name + 'IsBuilding');

  if (repo && build && masterBranch) {
    // If a repo is passed into this controller, select that repo
    angular.extend(SMC.state, {
      repo: repo,
      build: build,
      contextVersion: build.contextVersion,
      acv: build.contextVersion.getMainAppCodeVersion(),
      branch: masterBranch,
      repoSelected: true,
      advanced: false
    });
    SMC.state.mainRepoContainerFile.name = repo.attrs.name;
    SMC.state.opts.name = normalizeRepoName(repo);
    SMC.state.promises.contextVersion = $q.when(SMC.state.contextVersion);
    if (keypather.get(SMC, 'state.build.contextVersion.attrs.buildDockerfilePath')) {
      SMC.state.isMirroingDockerfile = true;
      SMC.state.step = null;
      SMC.selectedTab = 'buildfiles';
      var fullpath = keypather.get(SMC, 'state.build.contextVersion.attrs.buildDockerfilePath');
      // Get everything before the last '/' and add a '/' at the end
      var path = fullpath.replace(/^(.*)\/.*$/, '$1') + '/';
      // Get everything after the last '/'
      var name = fullpath.replace(/^.*\/(.*)$/, '$1');
      fetchUser()
        .then(function (user) {
          // TODO: Match with dockefile path
          SMC.state.dockerfile = SMC.state.contextVersion.newFile({
            _id: repo.dockerfiles[0].sha,
            id: repo.dockerfiles[0].sha,
            body: atob(repo.dockerfiles[0].content),
            name: name,
            path: path
          });
          SMC.openItems.add(SMC.state.dockerfile);
        });
    }
  } else {
    // TODO: Remove code when removing `dockerFileMirroing` code
    $q.all({
      instances: fetchInstancesByPod(),
      repoList: fetchOwnerRepos($rootScope.dataApp.data.activeAccount.oauthName())
    })
      .then(function (data) {
        SMC.data.instances = data.instances;
        SMC.data.githubRepos = data.repoList;
        SMC.data.githubRepos.models.forEach(function (repo) {
          repo.isAdded = SMC.isRepoAdded(repo, data.instances);
        });
      })
      .catch(errs.handler);
  }

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
  }, function (newPortsArray, oldPortsArray) {
    if (!angular.equals(newPortsArray, oldPortsArray)) {
      // Only update the Dockerfile if the ports have actually changed
      updateDockerfileFromState(SMC.state, true, true);
    }
  });

  $scope.$watchCollection(function () {
    return SMC.state.opts.env;
  }, function (newEnvArray, oldEnvArray) {
    if (!SMC.state.isMirroingDockerfile && !angular.equals(newEnvArray, oldEnvArray)) {
      // Only update the Dockerfile if the envs have actually changed
      updateDockerfileFromState(SMC.state, true, true);
    }
  });

  // TODO: Remove code when removing `dockerFileMirroing` code
  function normalizeRepoName(repo) {
    return repo.attrs.name.replace(/[^a-zA-Z0-9-]/g, '-');
  }

  // TODO: Remove code when removing `dockerFileMirroing` code
  SMC.isRepoAdded = function (repo, instances) {
    // Since the newServers may have faked repos (just containing names), just check the name

    return !!instances.find(function (instance) {
      var repoName = instance.getRepoName();
      if (repoName) {
        return repo.attrs.name === repoName;
      } else {
        return normalizeRepoName(repo) === instance.attrs.name;
      }
    });
  };

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
        if (!SMC.state.advanced) {
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
        // Reset the opts, in the same way as `EditServerModalController`
        SMC.state.opts  = {
          env: keypather.get(instance, 'attrs.env') || [],
          ipWhitelist: angular.copy(keypather.get(instance, 'attrs.ipWhitelist')) || {
            enabled: false
          }
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
    if (!tabVisibility[tabName]) {
      return false;
    }
    if (tabVisibility[tabName].featureFlagName && !$rootScope.featureFlags[tabVisibility[tabName].featureFlagName]) {
      return false;
    }
    if (SMC.state.advanced) {
      return tabVisibility[tabName].advanced;
    }
    return SMC.state.step >= tabVisibility[tabName].step;
  };

  SMC.isPrimaryButtonDisabled = function (serverFormInvalid) {
    return (
      (SMC.state.step === 2 && SMC.repositoryForm.$invalid) ||
      $filter('selectedStackInvalid')(SMC.state.selectedStack)
    );
  };

  SMC.needToBeDirtyToSaved = function () {
    if (!SMC.instance) {
      return false;
    }
    return true;
  };

  // TODO: Remove code when removing `dockerFileMirroing` code
  SMC.selectRepo = function (repo) {
    if (SMC.repoSelected || repo.isAdded) { return; }
    SMC.state.mainRepoContainerFile.name = repo.attrs.name;
    SMC.repoSelected = true;
    repo.loading = true;
    // Replace any non-word character with a -
    SMC.state.opts.name = normalizeRepoName(repo);

    // Since we have a new context version, we need to clear all promises
    // tied to any other context version (Usually handled by `resetStateContextVersion`)
    loadingPromises.clear(SMC.name);

    SMC.state.promises.contextVersion = loadingPromises.start(
      SMC.name,
      fetchStackData(repo)
        .then(function () {
          return createNewBuild($rootScope.dataApp.data.activeAccount);
        })
        .then(function (buildWithVersion) {
          SMC.state.build = buildWithVersion;
          SMC.state.contextVersion = buildWithVersion.contextVersion;
          SMC.state.advanced = false;
          return buildWithVersion.contextVersion;
        })
    );

    return SMC.state.promises.contextVersion
      .then(function () {
        return promisify(repo, 'fetchBranch')(repo.attrs.default_branch);
      })
      .then(function (masterBranch) {
        SMC.state.branch = masterBranch;
        // Set the repo here so the page change happens after all of these fetches
        return promisify(SMC.state.contextVersion.appCodeVersions, 'create', true)({
          repo: repo.attrs.full_name,
          branch: masterBranch.attrs.name,
          commit: masterBranch.attrs.commit.sha
        });
      })
      .then(function () {
        SMC.state.acv = SMC.state.contextVersion.getMainAppCodeVersion();
        SMC.state.repo = repo;
      })
      .catch(function (err) {
        if (err.message.match(/repo.*not.*found/ig)) {
          var message = 'Failed to add Webhooks. Please invite a member of this repository\'s owners team to add it to Runnable for the first time';
          errs.handler(new Error(message));
        } else {
          errs.handler(err);
        }
      })
      .finally(function () {
        repo.loading = false;
        SMC.repoSelected = false;
      });
  };
}
