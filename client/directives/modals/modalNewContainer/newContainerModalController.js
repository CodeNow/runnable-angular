'use strict';

require('app')
  .controller('NewContainerModalController', NewContainerModalController);

function NewContainerModalController(
  $q,
  $rootScope,
  copySourceInstance,
  createAndBuildNewContainer,
  createNewBuildAndFetchBranch,
  errs,
  eventTracking,
  fetchInstances,
  fetchInstancesByPod,
  fetchOwnerRepos,
  fetchRepoDockerfiles,
  getNewForkName,
  helpCards,
  keypather,
  loading,
  ModalService,
  promisify,
  close
) {
  var NCMC = this;
  var helpCard = helpCards.getActiveCard();
  angular.extend(NCMC, {
    name: 'newContainerModal',
    servicesActive: keypather.get(helpCard, 'id') === 'missingDependency',
    close: close,
    state: {
      tabName: 'repos',
      dockerfilePath: null,
      opts: {}
    }
  });

  // Start loading repos and templates
  loading.reset(NCMC.name + 'Repos');
  loading.reset(NCMC.name + 'Templates');

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

  NCMC.close = close;

  NCMC.addServerFromTemplate = function (sourceInstance) {
    var instanceToForkName = sourceInstance.attrs.name;
    close();
    return fetchInstances()
      .then(function (instances) {
        var serverName = getNewForkName(instanceToForkName, instances, true);
        var serverModel = {
          opts: {
            name: serverName,
            masterPod: true,
            ipWhitelist: {
              enabled: true
            }
          }
        };
        return createAndBuildNewContainer(
          copySourceInstance(
            $rootScope.dataApp.data.activeAccount,
            sourceInstance,
            serverName
          )
            .then(function (build) {
              serverModel.build = build;
              eventTracking.createdNonRepoContainer(instanceToForkName);
              return serverModel;
            }),
          serverName
        );
      })
      .catch(errs.handler);
  };

  NCMC.setRepo = function (repo, cb, cbParam) {
    repo.loading = true;
    NCMC.state.repo = repo;
    loading(NCMC.name + 'SingleRepoDockerfile', true);
    return fetchRepoDockerfiles(repo)
      .then(function (dockerfiles) {
        if (dockerfiles.length === 0) {
          return NCMC.createBuildAndGoToNewRepoModal(repo)
            .then(function () {
              repo.loading = false;
              loading(NCMC.name + 'SingleRepoDockerfile', false);
            });
        }
        repo.dockerfiles = dockerfiles;
        repo.loading = false;
        loading(NCMC.name + 'SingleRepoDockerfile', false);
        return cb(cbParam);
      });
  };

  NCMC.createBuildAndGoToNewRepoModal = function (repo, dockerfilePath) {
    loading(NCMC.name + 'SingleRepo', true);
    return createNewBuildAndFetchBranch($rootScope.dataApp.data.activeAccount, repo, dockerfilePath)
      .then(function (repoBuildAndBranch) {
        NCMC.newRepositoryContainer(repoBuildAndBranch);
      })
     .finally(function () {
        loading(NCMC.name + 'SingleRepo', false);
      });
  };

  NCMC.newRepositoryContainer = function (inputs) {
    close();
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
  // TODO: Remove code when removing `dockerFileMirroing` code
  NCMC.newTemplateContainer = function () {
    close();
    ModalService.showModal({
      controller: 'SetupTemplateModalController',
      controllerAs: 'STMC',
      templateUrl: 'setupTemplateModalView',
      inputs: {
        isolation: null
      }
    });
  };
}
