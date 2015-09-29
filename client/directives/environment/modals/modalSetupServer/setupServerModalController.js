'use strict';

require('app')
  .controller('SetupServerModalController', SetupServerModalController);

function SetupServerModalController (
  $scope,
  $q,
  createNewBuild,
  $rootScope,
  errs,
  fetchOwnerRepos,
  fetchStackAnalysis,
  hasKeypaths,
  keypather,
  loading,
  loadingPromises,
  promisify,
  updateDockerfileFromState,
  fetchDockerfileFromSource,
  $log,
  cardInfoTypes,
  OpenItems,
  fetchStackInfo,
  ModalService,
  data,
  actions,
  close
) {
  var SMC = this; // Server Modal Controller (shared with EditServerModalController)
  // This needs to go away soon.
  $scope.data = data;
  loadingPromises.clear('setupServerModal');
  loading.reset('setupServerModal');

  var mainRepoContainerFile = new cardInfoTypes.MainRepository();

  angular.extend(SMC, {
    close: close,
    closeWithConfirmation:function () {
      $rootScope.$broadcast('close-popovers');
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
    },
    isLoading: $rootScope.isLoading,
    portsSet: false,
    isNewContainer: true,
    openItems: new OpenItems(),
    getElasticHostname: function () {
      if (SMC.state.repo.attrs) {
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
        name: ''
      },
      selectedStack: null,
      step: 1
    },
    actions: actions,
    data: data,
    selectedTab: 'repository'
  });

  fetchOwnerRepos($rootScope.dataApp.data.activeAccount.oauthName())
    .then(function (repoList) {
      SMC.data.githubRepos = repoList;
      SMC.data.githubRepos.models.forEach(function (repo) {
         repo.isAdded = SMC.isRepoAdded(repo);
      });
    })
    .catch(errs.handler)
    .finally(function () {
      SMC.loading = false;
    });

  $scope.$watchCollection(function () {
     return SMC.state.ports;
  }, updateDockerfileFromState.bind(null, SMC.state, true, true));

  function normalizeRepoName(repo) {
    return repo.attrs.name.replace(/[^a-zA-Z0-9-]/g, '-');
  }

  SMC.isRepoAdded = function (repo) {
    // Since the newServers may have faked repos (just containing names), just check the name
    var instances = keypather.get(SMC, 'data.instances');
    if (!instances) {
      return false;
    }
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
    SMC.state.step += 1;
    if (SMC.state.step === 1) {
      SMC.changeTab('repository');
    }
    else if (SMC.state.step === 2) {
      SMC.changeTab('commands');
    }
    else if (SMC.state.step === 3) {
      SMC.changeTab(null);
      loadAllOptions(); // When stack is selected, load dockerfile, etc
    }
    else if (SMC.state.step === 4) {
       SMC.changeTab('logs');
    }
  };

  function openDockerfile() {
    return promisify(SMC.state.contextVersion, 'fetchFile')('/Dockerfile')
      .then(function (dockerfile) {
        if (SMC.state.dockerfile) {
          SMC.openItems.remove(SMC.state.dockerfile);
        }
        if (dockerfile) {
          SMC.openItems.add(dockerfile);
        }
        SMC.state.dockerfile = dockerfile;
      });
  }

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
    loading('setupServerModal', true); // Add spinner to modal
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
        return openDockerfile();
      })
      .then(function () {
        SMC.state.advanced = keypather.get(SMC.state.contextVersion, 'attrs.advanced') || false;
        SMC.state.promises.contextVersion = loadingPromises.add(
          'editServerModal',
          promisify(SMC.state.contextVersion, 'deepCopy')()
            .then(function (contextVersion) {
              SMC.state.contextVersion = contextVersion;
              SMC.state.acv = contextVersion.getMainAppCodeVersion();
              SMC.state.repo = keypather.get(contextVersion, 'getMainAppCodeVersion().githubRepo');
              return promisify(contextVersion, 'fetch')();
            })
        );
        return SMC.state.promises.contextVersion;
      })
      .then(function () {
        // Return modal to normal state
        loading('setupServerModal', false);
      });
  }

  SMC.changeTab = function (tabname) {
    SMC.selectedTab = tabname;
  };

  SMC.areStackAndVersionSelected = function () {
     return !!(SMC.state.selectedStack && SMC.state.selectedStack.selectedVersion);
  };

  SMC.createServer = function () {
    loading('setupServerModal', true); // Add spinner to modal
    var createPromise = loadingPromises.finished('setupServerModal')
      .then(function () {
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

    // We need to make sure that ports are loaded when the server is created
    if (Array.isArray(SMC.state.ports) && SMC.state.ports.length === 0) {
      SMC.state.ports = loadPorts();
    }
    return SMC.openItems.updateAllFiles()
      .then(function () {
         return SMC.actions.createAndBuild(createPromise, SMC.state.opts.name);
      })
      .then(function (instance) {
        SMC.instance = instance;
        SMC.state.instance = instance;
        if ($rootScope.featureFlags.newVerificationFlow) {
          // Go on to step 4 (logs)
          SMC.goToNextStep();
          loading('setupServerModal', false);
        } else {
          SMC.closeModal();
        }
      });
  };

  SMC.closeModal = function () {
    $rootScope.$broadcast('close-modal');
    close();
  };

  SMC.isDirty = function () {
    return loadingPromises.count('editServerModal') > 1 ||
      loadingPromises.count('editServerModal') > 1 ||
      keypather.get(SMC, 'instance.attrs.env') !== keypather.get(SMC, 'state.opts.env') ||
      !SMC.openItems.isClean();
  };

  SMC.selectRepo = function (repo) {
    if (SMC.repoSelected) { return; }
    SMC.state.mainRepoContainerFile.name = repo.attrs.name;
    SMC.repoSelected = true;
    repo.loading = true;
    // Replace any non-word character with a -
    SMC.state.opts.name = normalizeRepoName(repo);
    return SMC.fetchStackData(repo)
      .then(function () {
        return createNewBuild($rootScope.dataApp.data.activeAccount);
      })
      .then(function (buildWithVersion) {
        SMC.state.build = buildWithVersion;
        SMC.state.contextVersion = buildWithVersion.contextVersion;
        SMC.state.advanced = false;
        SMC.state.promises.contextVersion = $q.when(buildWithVersion.contextVersion);
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
      .catch(errs.handler)
      .finally(function () {
        repo.loading = false;
        SMC.repoSelected = false;
      });
  };

  SMC.fetchStackData = function (repo) {
    function setStackSelectedVersion(stack, versions) {
      if (versions[stack.key]) {
        stack.suggestedVersion = versions[stack.key];
      }
      if (stack.dependencies) {
        stack.dependencies.forEach(function (childStack) {
          setStackSelectedVersion(childStack, versions);
        });
      }
    }
    return fetchStackInfo()
      .then(function (stacks) {
        return fetchStackAnalysis(repo.attrs.full_name)
          .then(function (data) {
            if (!data.languageFramework) {
              $log.warn('No language detected');
              return;
            }
            if (data.languageFramework === 'ruby_ror') {
              data.languageFramework = 'rails';
            }
            repo.stackAnalysis = data;

            var stack = stacks.find(hasKeypaths({
              'key': data.languageFramework.toLowerCase()
            }));
            if (stack) {
              setStackSelectedVersion(stack, data.version);
              return stack;
            }
          });
      });
  };

}
