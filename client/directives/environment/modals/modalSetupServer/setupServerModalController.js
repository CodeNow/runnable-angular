'use strict';

require('app')
  .controller('SetupServerModalController', SetupServerModalController);

function SetupServerModalController (
  $scope,
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
  fetchStackInfo
) {

  var SMC = this; // Server Modal Controller (shared with EditServerModalController)
  loadingPromises.clear('setupServerModal');
  loading.reset('setupServerModal');

  var mainRepoContainerFile = new cardInfoTypes.MainRepository();

  angular.extend(SMC, {
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
      ports: [],
      opts: {
        masterPod: true,
        name: ''
      },
      step: 1,
      advanced: false,
      containerFiles: [
        mainRepoContainerFile
      ],
      packages: new cardInfoTypes.Packages()
    },
    // Copy $scope dependencies
    actions:  $scope.actions,
    data: $scope.data
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

  function loadAllOptions() {
    loading('setupServerModal', true); // Add spinner to modal
    // Populate ports at when stack has been selected
    var portsStr = keypather.get(SMC, 'state.selectedStack.ports');
    if (typeof portsStr === 'string') {
      portsStr = portsStr.replace(/,/gi, '');
      var ports = (portsStr || '').split(' ');
      // We need to keep the reference to the ports array
      if (SMC.state.ports.length > 0) {
        SMC.state.ports.splice(0, SMC.state.ports.length);
      }
      ports.forEach(function (port) {
        // After adding initially adding ports here, ports can no longer be 
        // added/removed since they are managed by the `ports-form` directive 
        // and will get overwritten.
        SMC.state.ports.push(port);
      });
    }
    return fetchDockerfileFromSource(SMC.state.selectedStack.key)
      .then(function () {
        return updateDockerfileFromState(SMC.state, true, true);
      })
      .then(function () {
        SMC.openItems.updateAllFiles();
        return openDockerfile();
      })
      .then(function () {
        // Return modal to normal state
        loading('setupServerModal', false);
      });
  }

  SMC.changeTab = function (tabname) {
    // If the user went to the 'repository' tab, she might have changed the
    // stack, so now we need to reload the stack and Dockerfile
    if (SMC.state.step > 2 && SMC.selectedTab === 'repository') {
      return loadAllOptions()
        .then(function () {
          SMC.selectedTab = tabname;
        });
    }
    SMC.selectedTab = tabname;
  };

  SMC.createServer = function () {
    var createPromise = loadingPromises.finished('setupServerModal')
      .then(function () {
        return updateDockerfileFromState(SMC.state, false, true);
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

    SMC.actions.createAndBuild(createPromise, SMC.state.opts.name);
  };

  SMC.selectRepo = function (repo) {
    if (SMC.repoSelected) { return; }
    mainRepoContainerFile.name = repo.attrs.name;
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
