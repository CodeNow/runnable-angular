'use strict';

require('app')
  .controller('NewContainerController', NewContainerController);

function NewContainerController(
  $q,
  $rootScope,
  $scope,
  $state,
  $timeout,
  ahaGuide,
  createNewBuildAndFetchBranch,
  createNewCluster,
  createNonRepoInstance,
  currentOrg,
  demoFlowService,
  errs,
  eventTracking,
  fetchInstances,
  fetchInstancesByPod,
  fetchOwnerRepos,
  fetchRepoDockerfiles,
  getNewForkName,
  handleSocketEvent,
  keypather,
  loading,
  ModalService
) {
  var NCC = this;
  var defaultState = this.state || {};
  angular.extend(NCC, {
    state: {
      panel: 'containerSelection',
      closed: false,
      tabName: 'repos',
      dockerFileTab: $rootScope.featureFlags.composeNewService ? 'compose' : 'dockerfile',
      dockerfile: null,
      configurationMethod: null,
      namesForAllInstances: [],
      opts: {},
      types: {}
    },
    ahaGuide: ahaGuide
  });
  angular.extend(NCC.state, defaultState);
  NCC.isPersonalAccount = currentOrg.isPersonalAccount;
  NCC.isInDemoFlow = demoFlowService.isInDemoFlow;
  NCC.shouldShowServicesCTA = demoFlowService.shouldShowServicesCTA;

  // Disable the back button because we are loading the modal with state, other than the default state
  // This means we have already finished the containerSelection step and the user can't go back to a different view
  // than they already started at
  if (NCC.state.panel !== 'containerSelection') {
    NCC.disableBackButton = true;
  }

  // Start loading repos and templates
  loading.reset('newContainerRepos');
  loading.reset('newContainerTemplates');
  loading.reset('newContainerSingleRepo');

  // Fetch all repos from Github
  loading('newContainerRepos', true);
  $q.all({
    instances: fetchInstancesByPod(),
    repoList: fetchOwnerRepos(currentOrg.github.oauthName())
  })
    .then(function (data) {
      NCC.instances = data.instances;
      NCC.state.namesForAllInstances = NCC.instances.map(function (instance) {
        return instance.attrs.name;
      });
      NCC.githubRepos = data.repoList;
    })
    .catch(errs.handler)
    .finally(function () {
      loading('newContainerRepos', false);
    });

  NCC.openedFirstAuthPrimer = function () {
    eventTracking.openedFirstAuthPrimer();
  };

  NCC.fetchTemplateServers = function () {
    loading('newContainerTemplates', true);
    // Fetch all non-repo containres
    return fetchInstances({ githubUsername: 'HelloRunnable' })
      .then(function (servers) {
        NCC.templateServers = servers;
        loading('newContainerTemplates', false);
        return servers;
      });
  };

  NCC.getSetupMethodText = function () {
    if (NCC.state.configurationMethod === 'dockerComposeFile') {
      return 'Create Cluster';
    }
    return 'Next Step: Configuration';
  };

  NCC.changeTab = function (tabName) {
    if (!['repos', 'services'].includes(tabName)) {
      return;
    }
    NCC.state.tabName = tabName;
    // Reset repo and template
    NCC.state.templateSource = null;
    NCC.state.repo = null;
    if (NCC.state.tabName === 'services' && !NCC.templateServers) {
      NCC.fetchTemplateServers();
    }
  };

  function normalizeRepoName(repo) {
    return repo.attrs.name.replace(/[^a-zA-Z0-9-]/g, '-');
  }

  NCC.isRepoAdded = function (repo, instances) {
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

  var injectedClose = NCC.close;
  NCC.close = function () {
    if (NCC.state.closed) { return; }
    NCC.state.closed = true;
    if (injectedClose) {
      return injectedClose();
    }
  };

  NCC.setTemplate = function (sourceInstance, goToPanelCb) {
    NCC.state.templateSource = sourceInstance;
    var instanceToForkName = sourceInstance.attrs.name;
    loading('newContainerSingleRepo', true);
    return fetchInstances()
      .then(function (instances) {
        loading('newContainerSingleRepo', false);
        var serverName = getNewForkName(instanceToForkName, instances, true);
        NCC.state.instanceName = serverName;
        /**
         * Warning: Hack Ahead
         *
         * Because of a bug in how animated-panels are rendered in Safari Retina
         * we added `ng-if`s to some animated panels in order for them to render
         * correctly. Because of this, we need to force a digest cycle in order
         * for the `nameContainer` panel to show up and for us to actually be
         * able to go to that panel.
         */
        return $timeout(angular.noop)
          .then(function () {
            return goToPanelCb('nameContainer');
          });
      })
      .catch(errs.handler);
  };

  NCC.addServerFromTemplate = function (sourceInstance) {
    var instanceToForkName = sourceInstance.attrs.name;
    NCC.close();
    return fetchInstances()
      .then(function (instances) {
        var serverName = getNewForkName(instanceToForkName, instances, true);
        return ModalService.showModal({
          controller: 'NameNonRepoContainerViewModalController',
          controllerAs: 'MC',
          templateUrl: 'nameNonRepoContainerView',
          inputs: {
            name: serverName,
            instanceToForkName: instanceToForkName,
            sourceInstance: sourceInstance,
            isolation: false
          }
        });
      })
      .catch(errs.handler);
  };

  NCC.saveName = function () {
    if (NCC.state.repo) {
      return $scope.$broadcast('go-to-panel', 'dockerfileMirroring');
    }
    return NCC.createBuildFromTemplate(NCC.state.instanceName, NCC.state.templateSource);
  };

  NCC.saveDockerfileMirroring = function () {
    if (NCC.state.configurationMethod === 'dockerComposeFile') {
      loading('creatingDockerCompose', true);
      return NCC.createComposeCluster()
        .then(function () {
          NCC.close();
          return $state.go('base.instances');
        })
        .catch(function(errorMsg) {
          var userFriendlyError = NCC.populateComposeErrorMessage(errorMsg);
          errs.handler({ message: userFriendlyError});
        })
        .finally(function () {
          loading('creatingDockerCompose', false);
        });
    }

    return NCC.createBuildAndGoToNewRepoModal(NCC.state.instanceName, NCC.state.repo, NCC.state.dockerfile, NCC.state.configurationMethod);
  };

  NCC.setRepo = function (repo, goToPanelCb) {
    if (repo.attrs.full_name === keypather.get(NCC, 'state.repo.attrs.full_name')) {
      return goToPanelCb('nameContainer');
    }
    repo.loading = true;
    NCC.state.repo = repo;
    loading('newContainerSingleRepo', true);
    var fullName = keypather.get(repo, 'attrs.full_name');
    var defaultBranch = keypather.get(repo, 'attrs.default_branch');
    NCC.state.configurationMethod = null;
    NCC.state.instanceName = fullName.split('/')[1] || '';
    NCC.state.instanceName = NCC.state.instanceName.replace(/_/g, '-');
    return fetchRepoDockerfiles(fullName, defaultBranch)
      .then(function (dockerfiles) {
        loading('newContainerSingleRepo', false);
        repo.loading = false;
        repo.dockerfiles = dockerfiles;
        NCC.state.dockerfile = null;
        return goToPanelCb('nameContainer');
      });
  };

  NCC.createBuildAndGoToNewRepoModal = function (instanceName, repo, dockerfile, configurationMethod) {
    var dockerfilePath;
    loading('newContainerSingleRepo', true);

    if (configurationMethod === 'blankDockerfile' || configurationMethod === 'new') {
      dockerfilePath = '';
    } else {
      configurationMethod = 'dockerfile';
      dockerfilePath = keypather.get(dockerfile, 'path');
    }

    return createNewBuildAndFetchBranch(currentOrg.github, repo, dockerfilePath, configurationMethod)
      .then(function (repoBuildAndBranch) {
        repoBuildAndBranch.instanceName = instanceName;
        repoBuildAndBranch.build.opts = NCC.state.opts;
        if (configurationMethod === 'dockerfile' && dockerfile) {
          NCC.newMirrorRepositoryContainer(repoBuildAndBranch);
        } else if (configurationMethod === 'blankDockerfile'){
          NCC.newRepositoryContainer(repoBuildAndBranch, configurationMethod);
        } else {
          NCC.newRepositoryContainer(repoBuildAndBranch, false);
        }
      })
      .finally(function () {
        loading('newContainerSingleRepo', false);
      });
  };

  NCC.createBuildFromTemplate = function (instanceName, sourceInstance) {
    NCC.close();
    return createNonRepoInstance(instanceName, sourceInstance)
      .catch(errs.handler);
  };

  NCC.newRepositoryContainer = function (inputs, configurationMethod) {
    if (NCC.state.closed) { return; }
    NCC.close();
    ModalService.showModal({
      controller: 'SetupServerModalController',
      controllerAs: 'SMC',
      templateUrl: 'setupServerModalView',
      inputs: angular.extend({
        dockerfileType: configurationMethod,
        instanceName: null,
        repo: null,
        build: null,
        masterBranch: null,
        defaults: {}
      }, inputs)
    });
  };

  NCC.newMirrorRepositoryContainer = function (inputs) {
    if (NCC.state.closed) { return; }
    NCC.close();
    ModalService.showModal({
      controller: 'SetupMirrorServerModalController',
      controllerAs: 'SMC',
      templateUrl: 'setupMirrorServerModalView',
      inputs: angular.extend({
        instanceName: null,
        repo: null,
        build: null,
        masterBranch: null
      }, inputs)
    });
  };

  NCC.showAddServicesPopover = function () {
    return !NCC.isPersonalAccount() && (NCC.shouldShowServicesCTA() || !NCC.isInDemoFlow());
  };

  NCC.openModalAtPanel = function (panelName) {
    $rootScope.$broadcast('close-popovers');
    NCC.state.panel = panelName;
    return ModalService.showModal({
      controller: 'NewContainerModalController',
      controllerAs: 'NCMC',
      templateUrl: 'newContainerModalView',
      inputs: {
        optionalInputs: {
          state: NCC.state
        }
      }
    });
  };

  NCC.createComposeCluster = function () {
    if (NCC.state.dockerComposeFile && (!$rootScope.featureFlags.composeNewService || NCC.state.types.stage)) {
      return createNewCluster(
        NCC.state.repo.attrs.full_name,
        NCC.state.repo.attrs.default_branch,
        NCC.state.dockerComposeFile.path,
        NCC.state.instanceName,
        currentOrg.github.attrs.id
      )
      .then(function(res) {
        if (!$rootScope.featureFlags.composeNewService) {
          return;
        }
        return handleSocketEvent('compose-cluster-created');
      })
      .then(function(parentCluster) {
        if (NCC.state.dockerComposeTestFile && parentCluster.clusterName === NCC.state.instanceName) {
          var instanceName = NCC.state.instanceName + '-test';
          return createNewCluster(
            NCC.state.repo.attrs.full_name,
            NCC.state.repo.attrs.default_branch,
            NCC.state.dockerComposeTestFile.path,
            instanceName,
            currentOrg.github.attrs.id,
            !!NCC.state.dockerComposeTestFile,
            [ NCC.state.testReporter.name ],
            parentCluster.parentInputClusterConfigId
          );
        }
        return;
      });
    }

    return createNewCluster(
      NCC.state.repo.attrs.full_name,
      NCC.state.repo.attrs.default_branch,
      NCC.state.dockerComposeTestFile.path,
      NCC.state.instanceName,
      currentOrg.github.attrs.id,
      !!NCC.state.dockerComposeTestFile,
      [ NCC.state.testReporter.name ]
    );
  };

  NCC.getNextStepText = function () {
    if (NCC.state.configurationMethod === 'blankDockerfile' || NCC.state.configurationMethod === 'new') {
      return 'Next Step: Setup';
    }
    if (NCC.state.configurationMethod === 'dockerComposeFile' && NCC.state.dockerComposeFile && NCC.state.dockerComposeTestFile) {
      return 'Create Environments';
    }
      return 'Create Environment';
  };

  NCC.canCreateBuild = function () {
    return  keypather.get(NCC, 'state.instanceName.length') && !keypather.get(NCC, 'nameForm.$invalid') &&
            !$rootScope.isLoading.newContainerSingleRepo && !$rootScope.isLoading.creatingDockerCompose && (NCC.state.templateSource || 
            !$scope.$root.featureFlags.composeNewService || NCC.validateDockerComposeBuild());
  };

  NCC.validateDockerComposeBuild = function () {
    return ((NCC.state.configurationMethod === 'new' || NCC.state.configurationMethod === 'blankDockerfile') ||
            (NCC.state.configurationMethod === 'dockerfile' && NCC.state.dockerfile) ||
            (NCC.state.configurationMethod === 'dockerComposeFile' &&
            ((NCC.state.types.test ? NCC.state.dockerComposeTestFile && NCC.state.testReporter : NCC.state.types.stage) &&
            (NCC.state.types.stage ? NCC.state.dockerComposeFile : NCC.state.types.test))));
  };

  NCC.populateComposeErrorMessage = function (errorMsg) {
    var err = /ValidationError(.*)/.exec(errorMsg);
    if (err) {
      return 'There was an error parsing your Docker Compose file: ' + err[0];
    }
    return 'There was an error creating the Docker Compose cluster.';
  };
}
