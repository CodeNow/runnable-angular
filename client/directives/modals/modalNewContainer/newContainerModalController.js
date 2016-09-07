'use strict';

require('app')
  .controller('NewContainerModalController', NewContainerModalController);

function NewContainerModalController(
  $q,
  $timeout,
  ahaGuide,
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
  close,
  currentOrg
) {
  var MC = this;
  var helpCard = helpCards.getActiveCard();
  angular.extend(MC, {
    name: 'newContainerModal',
    servicesActive: keypather.get(helpCard, 'id') === 'missingDependency',
    state: {
      tabName: 'repos',
      dockerfile: null,
      configurationMethod: null,
      namesForAllInstances: []
    },
    ahaGuide: ahaGuide
  });

  // Start loading repos and templates
  loading.reset(MC.name + 'Repos');
  loading.reset(MC.name + 'Templates');
  loading.reset(MC.name + 'SingleRepo');

  // Fetch all repos from Github
  loading(MC.name + 'Repos', true);
  $q.all({
    instances: fetchInstancesByPod(),
    repoList: fetchOwnerRepos(currentOrg.github.oauthName())
  })
    .then(function (data) {
      MC.instances = data.instances;
      MC.state.namesForAllInstances = MC.instances.map(function (instance) {
        return instance.attrs.name;
      });
      MC.githubRepos = data.repoList;
      MC.githubRepos.models.forEach(function (repo) {
        repo.isAdded = MC.isRepoAdded(repo, data.instances);
      });
    })
    .catch(errs.handler)
    .finally(function () {
      loading(MC.name + 'Repos', false);
    });

  MC.fetchTemplateServers = function () {
    loading(MC.name + 'Templates', true);
    // Fetch all non-repo containres
    return fetchInstances({ githubUsername: 'HelloRunnable' })
      .then(function (servers) {
        MC.templateServers = servers;
        loading(MC.name + 'Templates', false);
        return servers;
      });
  };

  MC.changeTab = function (tabName) {
    if (!['repos', 'services'].includes(tabName)) {
      return;
    }
    MC.state.tabName = tabName;
    // Reset repo and template
    MC.state.templateSource = null;
    MC.state.repo = null;
    if (MC.state.tabName === 'services' && !MC.templateServers) {
      MC.fetchTemplateServers();
    }
  };

  function normalizeRepoName(repo) {
    return repo.attrs.name.replace(/[^a-zA-Z0-9-]/g, '-');
  }

  MC.isRepoAdded = function (repo, instances) {
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

  MC.close = function () {
    if (MC.state.closed) { return; }
    MC.state.closed = true;
    return close();
  };

  MC.setTemplate = function (sourceInstance, goToPanelCb) {
    MC.state.templateSource = sourceInstance;
    var instanceToForkName = sourceInstance.attrs.name;
    loading(MC.name + 'SingleRepo', true);
    return fetchInstances()
      .then(function (instances) {
        loading(MC.name + 'SingleRepo', false);
        var serverName = getNewForkName(instanceToForkName, instances, true);
        MC.state.instanceName = serverName;
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

  MC.addServerFromTemplate = function (sourceInstance) {
    var instanceToForkName = sourceInstance.attrs.name;
    MC.close();
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

  MC.setRepo = function (repo, goToPanelCb) {
    if (repo.attrs.full_name === keypather.get(MC, 'state.repo.attrs.full_name')) {
      return goToPanelCb('dockerfileMirroring');
    }
    repo.loading = true;
    MC.state.repo = repo;
    loading(MC.name + 'SingleRepo', true);
    var fullName = keypather.get(repo, 'attrs.full_name');
    var defaultBranch = keypather.get(repo, 'attrs.default_branch');
    MC.state.configurationMethod = null;
    MC.state.instanceName = fullName.split('/')[1] || '';
    MC.state.instanceName = MC.state.instanceName.replace(/_/g, '-');
    return fetchRepoDockerfiles(fullName, defaultBranch)
      .then(function (dockerfiles) {
        loading(MC.name + 'SingleRepo', false);
        repo.loading = false;
        repo.dockerfiles = dockerfiles;
        MC.state.dockerfile = null;
        return goToPanelCb('dockerfileMirroring');
      });
  };

  MC.createBuildAndGoToNewRepoModal = function (instanceName, repo, dockerfile, configurationMethod) {
    var dockerfilePath;
    loading(MC.name + 'SingleRepo', true);

    if (configurationMethod === 'dockerfile') {
      dockerfilePath = keypather.get(dockerfile, 'path');
    } else {
      dockerfilePath = '';
    }
    return createNewBuildAndFetchBranch(currentOrg.github, repo, dockerfilePath)
      .then(function (repoBuildAndBranch) {
        repoBuildAndBranch.instanceName = instanceName;
        if (configurationMethod === 'dockerfile' && dockerfile) {
          MC.newMirrorRepositoryContainer(repoBuildAndBranch);
        } else if (configurationMethod === 'blankDockerfile'){
          MC.newRepositoryContainer(repoBuildAndBranch, configurationMethod);
        } else {
          MC.newRepositoryContainer(repoBuildAndBranch, false);
        }
      })
      .finally(function () {
        loading(MC.name + 'SingleRepo', false);
      });
  };

  MC.createBuildFromTemplate = function (instanceName, sourceInstance) {
    MC.close();
    return createNonRepoInstance(instanceName, sourceInstance)
      .catch(errs.handler);
  };

  MC.newRepositoryContainer = function (inputs, configurationMethod) {
    if (MC.state.closed) { return; }
    MC.close();
    ModalService.showModal({
      controller: 'SetupServerModalController',
      controllerAs: 'SMC',
      templateUrl: 'setupServerModalView',
      inputs: angular.extend({
        dockerfileType: configurationMethod,
        instanceName: null,
        repo: null,
        build: null,
        masterBranch: null
      }, inputs)
    });
  };

  MC.newMirrorRepositoryContainer = function (inputs) {
    if (MC.state.closed) { return; }
    MC.close();
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
