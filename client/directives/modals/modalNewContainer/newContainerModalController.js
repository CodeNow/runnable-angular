'use strict';

require('app')
  .controller('NewContainerModalController', NewContainerModalController);

function NewContainerModalController(
  $q,
  $rootScope,
  ModalService,
  copySourceInstance,
  createAndBuildNewContainer,
  errs,
  eventTracking,
  fetchInstances,
  fetchInstancesByPod,
  fetchOwnerRepos,
  getNewForkName,
  keypather,
  helpCards,
  close
) {
  var NCMC = this;
  var helpCard = helpCards.getActiveCard();
  NCMC.servicesActive = keypather.get(helpCard, 'id') === 'missingDependency';
  NCMC.close = close;

  NCMC.state = {
    repoSelected: false,
    addRepoTab: true,
    loadingRepos: true,
    loadingTemplates: true,
    opts: {}
  };

  // Fetch all repos from Github
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
      NCMC.state.loadingRepos = false;
    });

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

  // Fetch all non-repo containres
  fetchInstances({ githubUsername: 'HelloRunnable' })
    .then(function (servers) {
      NCMC.templateServers = servers;
      NCMC.state.loadingTemplates = false;
    });

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

  NCMC.setRepo = function (repo) {
    NCMC.state.repo = repo;
    return true;
  };

  NCMC.newRepositoryContainer = function (repo) {
    close();
    ModalService.showModal({
      controller: 'SetupServerModalController',
      controllerAs: 'SMC',
      templateUrl: 'setupServerModalView',
      inputs: {
        repo: repo
      }
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
