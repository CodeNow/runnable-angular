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
  fetchInstances,
  fetchInstancesByPod,
  fetchOwnerRepos,
  fetchRepoDockerfiles,
  getNewForkName,
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
      dockerfile: null,
      configurationMethod: null,
      namesForAllInstances: [],
      opts: {}
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
      return createNewCluster(
        NCC.state.repo.attrs.full_name,
        NCC.state.repo.attrs.default_branch,
        NCC.state.dockerComposeFile.path,
        NCC.state.instanceName
      )
        .then(function () {
          $state.go('base.instances');
          NCC.close();
        })
        .catch(errs.handler);
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

    if (configurationMethod === 'dockerfile') {
      dockerfilePath = keypather.get(dockerfile, 'path');
    } else {
      dockerfilePath = '';
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
}
