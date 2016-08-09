'use strict';

require('app')
  .controller('NewContainerModalController', NewContainerModalController);

function NewContainerModalController(
  $q,
  $rootScope,
  $timeout,
  createNewBuildAndFetchBranch,
  createNonRepoInstance,
  errs,
  fetchInstances,
  fetchInstancesByPod,
  fetchOwnerRepos,
  fetchRepoDockerfiles,
  getNewForkName,
  helpCards,
  keypather,
  loading,
  ModalService,
  close
) {
  var NCMC = this;
  var helpCard = helpCards.getActiveCard();
  angular.extend(NCMC, {
    name: 'newContainerModal',
    servicesActive: keypather.get(helpCard, 'id') === 'missingDependency',
    state: {
      tabName: 'repos',
      dockerfile: null,
      namesForAllInstances: []
    }
  });

  // Start loading repos and templates
  loading.reset(NCMC.name + 'Repos');
  loading.reset(NCMC.name + 'Templates');
  loading.reset(NCMC.name + 'SingleRepo');

  // Fetch all repos from Github
  loading(NCMC.name + 'Repos', true);
  $q.all({
    instances: fetchInstancesByPod(),
    repoList: fetchOwnerRepos($rootScope.dataApp.data.activeAccount.oauthName())
  })
    .then(function (data) {
      NCMC.instances = data.instances;
      NCMC.state.namesForAllInstances = NCMC.instances.map(function (instance) {
        return instance.attrs.name;
      });
      NCMC.githubRepos = data.repoList;
      NCMC.githubRepos.models.forEach(function (repo) {
        repo.isAdded = NCMC.isRepoAdded(repo, data.instances);
      });
    })
    .catch(errs.handler)
    .finally(function () {
      loading(NCMC.name + 'Repos', false);
    });

  NCMC.fetchTemplateServers = function () {
    loading(NCMC.name + 'Templates', true);
    // Fetch all non-repo containres
    return fetchInstances({ githubUsername: 'HelloRunnable' })
      .then(function (servers) {
        NCMC.templateServers = servers;
        loading(NCMC.name + 'Templates', false);
        return servers;
      });
  };

  NCMC.changeTab = function (tabName) {
    if (!['repos', 'services'].includes(tabName)) {
      return;
    }
    NCMC.state.tabName = tabName;
    // Reset repo and template
    NCMC.state.templateSource = null;
    NCMC.state.repo = null;
    if (NCMC.state.tabName === 'services' && !NCMC.templateServers) {
      NCMC.fetchTemplateServers();
    }
  };

  function normalizeRepoName(repo) {
    return repo.attrs.name.replace(/[^a-zA-Z0-9-]/g, '-');
  }

  NCMC.isRepoAdded = function (repo, instances) {
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

  NCMC.close = function () {
    if (NCMC.state.closed) { return; }
    NCMC.state.closed = true;
    return close();
  };

  NCMC.setTemplate = function (sourceInstance, goToPanelCb) {
    NCMC.state.templateSource = sourceInstance;
    var instanceToForkName = sourceInstance.attrs.name;
    loading(NCMC.name + 'SingleRepo', true);
    return fetchInstances()
      .then(function (instances) {
        loading(NCMC.name + 'SingleRepo', false);
        var serverName = getNewForkName(instanceToForkName, instances, true);
        NCMC.state.instanceName = serverName;
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

  NCMC.addServerFromTemplate = function (sourceInstance) {
    var instanceToForkName = sourceInstance.attrs.name;
    NCMC.close();
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

  NCMC.setRepo = function (repo, goToPanelCb, createContainerDirectly) {
    if (repo.attrs.full_name === keypather.get(NCMC, 'state.repo.attrs.full_name')) {
      return goToPanelCb('dockerfileMirroring');
    }
    repo.loading = true;
    NCMC.state.repo = repo;
    loading(NCMC.name + 'SingleRepo', true);
    var fullName = keypather.get(repo, 'attrs.full_name');
    var defaultBranch = keypather.get(repo, 'attrs.default_branch');
    NCMC.state.instanceName = fullName.split('/')[1] || '';
    NCMC.state.instanceName = NCMC.state.instanceName.replace(/_/g, '-');
    return fetchRepoDockerfiles(fullName, defaultBranch)
      .then(function (dockerfiles) {
        // TODO: Remove when removing `nameContainer` FF
        if (dockerfiles.length === 0 && createContainerDirectly) {
          return NCMC.createBuildAndGoToNewRepoModal(NCMC.state.instanceName, repo)
            .then(function () {
              repo.loading = false;
              loading(NCMC.name + 'SingleRepo', false);
            });
        }
        loading(NCMC.name + 'SingleRepo', false);
        repo.loading = false;
        repo.dockerfiles = dockerfiles;
        NCMC.state.dockerfile = null;
        return goToPanelCb('dockerfileMirroring');
      });
  };

  NCMC.createBuildAndGoToNewRepoModal = function (instanceName, repo, dockerfile) {
    loading(NCMC.name + 'SingleRepo', true);
    return createNewBuildAndFetchBranch($rootScope.dataApp.data.activeAccount, repo, keypather.get(dockerfile, 'path'))
      .then(function (repoBuildAndBranch) {
        repoBuildAndBranch.instanceName = instanceName;
        if (dockerfile) {
          NCMC.newMirrorRepositoryContainer(repoBuildAndBranch);
        } else {
          NCMC.newRepositoryContainer(repoBuildAndBranch);
        }
      })
      .finally(function () {
        loading(NCMC.name + 'SingleRepo', false);
      });
  };

  NCMC.createBuildFromTemplate = function (instanceName, sourceInstance) {
    NCMC.close();
    return createNonRepoInstance(instanceName, sourceInstance)
      .catch(errs.handler);
  };

  NCMC.newRepositoryContainer = function (inputs) {
    if (NCMC.state.closed) { return; }
    NCMC.close();
    ModalService.showModal({
      controller: 'SetupServerModalController',
      controllerAs: 'SMC',
      templateUrl: 'setupServerModalView',
      inputs: angular.extend({
        instanceName: null,
        repo: null,
        build: null,
        masterBranch: null
      }, inputs)
    });
  };

  NCMC.newMirrorRepositoryContainer = function (inputs) {
    if (NCMC.state.closed) { return; }
    NCMC.close();
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
}
