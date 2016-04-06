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
      addRepoTab: true,
      opts: {}
    }
  });

  // Start loading repos and templates
  loading(NCMC.name + 'Repos', true);
  loading(NCMC.name + 'Templates', true);

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
      loading(NCMC.name + 'Repos', false);
    });

  // Fetch all non-repo containres
  fetchInstances({ githubUsername: 'HelloRunnable' })
    .then(function (servers) {
      NCMC.templateServers = servers;
      loading(NCMC.name + 'Templates', false);
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

  NCMC.selectRepo = function (repo) {
    loading(NCMC.name + 'SingleRepo', true);
    return createNewBuildAndFetchBranch($rootScope.dataApp.data.activeAccount, repo)
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
