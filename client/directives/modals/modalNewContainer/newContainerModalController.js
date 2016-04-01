'use strict';

require('app')
  .controller('NewContainerModalController', NewContainerModalController);

function NewContainerModalController(
  $q,
  $rootScope,
  ModalService,
  errs,
  fetchInstancesByPod,
  fetchOwnerRepos,
  keypather,
  helpCards,
  close
) {
  var NCMC = this;
  var helpCard = helpCards.getActiveCard();
  NCMC.servicesActive = keypather.get(helpCard, 'id') === 'missingDependency';
  NCMC.close = close;

  NCMC.state = {
    addRepoTab: true,
    loadingRepos: true
  };

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

  // TODO: Remove code when removing `dockerFileMirroing` code
  NCMC.newRepositoryContainer = function () {
    close();
    ModalService.showModal({
      controller: 'SetupServerModalController',
      controllerAs: 'SMC',
      templateUrl: 'setupServerModalView'
    });
  };
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
