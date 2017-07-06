'use strict';

require('app')
  .controller('NewContainerController', NewContainerController);

function NewContainerController(
  $q,
  $rootScope,
  $sce,
  $scope,
  $state,
  $timeout,
  ahaGuide,
  createNewBuildAndFetchBranch,
  createNewCluster,
  createNewMultiClusters,
  createNonRepoInstance,
  currentOrg,
  demoFlowService,
  errs,
  eventTracking,
  fetchInstances,
  fetchInstancesByPod,
  fetchOrganizationRepos,
  fetchRepoDockerfiles,
  getNewForkName,
  handleMultiClusterCreateResponse,
  handleSocketEvent,
  keypather,
  loading,
  ModalService,
  searchOrganizationRepos
) {
  $scope.$sce = $sce;
  var NCC = this;
  var defaultState = this.state || {};
  var defaultTab = 'dockerfile';
  if ($rootScope.featureFlags.composeNewService) {
    defaultTab = $rootScope.featureFlags.kubernetes ? 'kubernetes' : 'compose';
  }
  angular.extend(NCC, {
    state: {
      panel: 'containerSelection',
      closed: false,
      tabName: 'repos',
      dockerFileTab: defaultTab,
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
  NCC.numberOfReposToQuery = 20;
  $q.all({
    instances: fetchInstancesByPod(),
    repoList: fetchOrganizationRepos(currentOrg.github.oauthName(), NCC.numberOfReposToQuery)
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

    NCC.fetchSearchTermsAndAppendToRepos = function () {
      loading('newContainerRepos', true);
      return searchOrganizationRepos(currentOrg.github.oauthName(), NCC.repoFilter)
        .then(function (repoCollection) {
          // Merge both collections together
          if (repoCollection && repoCollection.length > 0) {
            repoCollection.forEach(function (repo) {
              NCC.githubRepos.add(repo);
            });
          }
          loading('newContainerRepos', false);
        });
    };


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
      .catch(errs.handler)
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

  NCC.createMultipleComposeCluster = function () {
    return $q.when()
      .then(function () {
        if (NCC.state.dockerComposeFile && NCC.state.types.stage) {
          return createNewMultiClusters(
            NCC.state.repo.attrs.full_name,
            NCC.state.branch.attrs.name,
            NCC.state.dockerComposeFile.path,
            currentOrg.github.attrs.id
          )
            .then(handleMultiClusterCreateResponse);
        }
      })
      .then(function () {
        if (!NCC.state.dockerComposeTestFile) {
          return;
        }
        return createNewMultiClusters(
          NCC.state.repo.attrs.full_name,
          NCC.state.branch.attrs.name,
          NCC.state.dockerComposeTestFile.path,
          currentOrg.github.attrs.id,
          !!NCC.state.dockerComposeTestFile,
          [NCC.state.testReporter.name]
        )
          .then(handleMultiClusterCreateResponse);
      });
  };

  NCC.createBranchComposeCluster = function () {
    var clusterOpts;
    if (NCC.state.dockerComposeFile && NCC.state.types.stage) {
      clusterOpts = {
        isTesting: false,
        testReporters: [],
        parentInputClusterConfigId: '',
        shouldNotAutoFork: !!$rootScope.featureFlags.multipleWebhooks
      };
      return createNewCluster(
        NCC.state.repo.attrs.full_name,
        NCC.state.branch.attrs.name,
        NCC.state.dockerComposeFile.path,
        NCC.state.instanceName,
        currentOrg.github.attrs.id,
        clusterOpts
      )
        .then(function () {
          return handleSocketEvent('compose-cluster-created');
        })
        .then(function (parentCluster) {
          if (NCC.state.dockerComposeTestFile && parentCluster.clusterName === NCC.state.instanceName) {
            var instanceName = NCC.state.instanceName + '-test';
            clusterOpts = {
              isTesting: !!NCC.state.dockerComposeTestFile,
              testReporters: [ NCC.state.testReporter.name ],
              parentInputClusterConfigId: parentCluster.parentInputClusterConfigId,
              shouldNotAutoFork: !!$rootScope.featureFlags.multipleWebhooks
            };
            return createNewCluster(
              NCC.state.repo.attrs.full_name,
              NCC.state.branch.attrs.name,
              NCC.state.dockerComposeTestFile.path,
              instanceName,
              currentOrg.github.attrs.id,
              clusterOpts
            );
          }
        });
    }
    // test cluster only
    clusterOpts = {
      isTesting: !!NCC.state.dockerComposeTestFile,
      testReporters: [ NCC.state.testReporter.name ],
      parentInputClusterConfigId: '',
      shouldNotAutoFork: !!$rootScope.featureFlags.multipleWebhooks
    };
    return createNewCluster(
      NCC.state.repo.attrs.full_name,
      NCC.state.branch.attrs.name,
      NCC.state.dockerComposeTestFile.path,
      NCC.state.instanceName,
      currentOrg.github.attrs.id,
      clusterOpts
    )
      .then(function () {
        return handleSocketEvent('compose-cluster-created');
      });
  };

  NCC.createComposeCluster = function () {
    if ($rootScope.featureFlags.multipleWebhooks && NCC.state.branch.attrs.name === NCC.state.repo.attrs.default_branch) {
      return NCC.createMultipleComposeCluster();
    }
    return NCC.createBranchComposeCluster();
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
    var hasInstances = keypather.get(NCC, 'state.instanceName.length');
    var isLoading = $rootScope.isLoading.newContainerSingleRepo || $rootScope.isLoading.creatingDockerCompose;
    var isFormValid = !keypather.get(NCC, 'nameForm.$invalid');
    var isTemplate = NCC.state.templateSource;
    var isValidCompose = !$scope.$root.featureFlags.composeNewService || NCC.validateDockerComposeBuild();
    return hasInstances &&
           isFormValid &&
           !isLoading &&
           (isTemplate || isValidCompose);
  };

  NCC.validateDockerComposeBuild = function () {
    var isNewBlankDockerfile = ['new', 'blankDockerfile'].includes(NCC.state.configurationMethod);
    var isValidDockerfile = NCC.state.configurationMethod === 'dockerfile' && NCC.state.dockerfile;
    var isValidComposeFile = false;
    if (NCC.state.configurationMethod === 'dockerComposeFile') {
      var isValidTestCompose = true;
      var isValidStagingCompose = true;
      var hasTestOrStaging = NCC.state.types.test || NCC.state.types.stage;
      if (NCC.state.types.test) {
        isValidTestCompose = NCC.state.dockerComposeTestFile && NCC.state.testReporter;
      }
      if (NCC.state.types.stage) {
        isValidStagingCompose = NCC.state.dockerComposeFile;
      }
      isValidComposeFile = hasTestOrStaging && isValidTestCompose && isValidStagingCompose;
    }
    return isNewBlankDockerfile || isValidDockerfile || isValidComposeFile;
  };

  NCC.isSaving = function () {
    return $rootScope.isLoading.newContainerSingleRepo || $rootScope.isLoading.creatingDockerCompose;
  };

  NCC.setToComposeTab = function () {
    if (!NCC.isSaving()) {
      NCC.state.dockerFileTab = 'compose';
      NCC.state.configurationMethod = 'dockerComposeFile';
    }
  };

  NCC.setToDockerTab = function () {
    if (!NCC.isSaving()) {
      NCC.state.dockerFileTab = 'dockerfile';
      NCC.state.configurationMethod = 'dockerfile';
    }
  };

  NCC.populateComposeErrorMessage = function (errorMsg) {
    var err = /ValidationError(.*)/.exec(errorMsg);
    if (err) {
      return 'There was an error parsing your Docker Compose file: ' + err[0];
    }
    return 'There was an error creating the Docker Compose cluster:' + errorMsg;
  };
}
