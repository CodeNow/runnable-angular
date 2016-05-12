'use strict';

require('app')
  .controller('NewContainerModalController', NewContainerModalController);

function NewContainerModalController(
  $q,
  $rootScope,
  createNewBuildAndFetchBranch,
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
      opts: {}
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

  NCMC.setRepo = function (repo, goToPanelCb, panelName) {
    repo.loading = true;
    NCMC.state.repo = repo;
    loading(NCMC.name + 'SingleRepo', true);
    var fullName = keypather.get(repo, 'attrs.full_name');
    var defaultBranch = keypather.get(repo, 'attrs.default_branch');
    return fetchRepoDockerfiles(fullName, defaultBranch)
      .then(function (dockerfiles) {
        if (dockerfiles.length === 0) {
          return NCMC.createBuildAndGoToNewRepoModal(repo)
            .then(function () {
              repo.loading = false;
              loading(NCMC.name + 'SingleRepo', false);
            });
        }
        repo.dockerfiles = dockerfiles;
        repo.loading = false;
        loading(NCMC.name + 'SingleRepo', false);
        NCMC.state.dockerfile = null;
        return goToPanelCb(panelName);
      });
  };

  NCMC.createBuildAndGoToNewRepoModal = function (repo, dockerfile) {
    loading(NCMC.name + 'SingleRepo', true);
    return createNewBuildAndFetchBranch($rootScope.dataApp.data.activeAccount, repo, keypather.get(dockerfile, 'path'))
      .then(function (repoBuildAndBranch) {
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

  NCMC.newRepositoryContainer = function (inputs) {
    if (NCMC.state.closed) { return; }
    NCMC.close();
    ModalService.showModal({
      controller: 'SetupServerModalController',
      controllerAs: 'SMC',
      templateUrl: 'setupServerModalView',
      inputs: angular.extend({
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
        repo: null,
        build: null,
        masterBranch: null
      }, inputs)
    });
  };
}
