'use strict';

require('app')
  .controller('AhaModalController', AhaModalController);

function AhaModalController(
  $q,
  $timeout,
  $rootScope,
  ahaGuide,
  createNewBuildAndFetchBranch,
  currentOrg,
  errs,
  fetchInstancesByPod,
  fetchOwnerRepos,
  fetchStackInfo,
  github,
  loading,
  ModalService,

  // Injected inputs
  close
) {
  var AMC = this;
  AMC.actions = {
    close: function (endGuide) {
      if (!$rootScope.featureFlags.demoProject || AMC.hasInstances) {
        if (endGuide) {
          ahaGuide.endGuide();
        }
        close();
      }
    }
  };

  AMC.steps = ahaGuide.steps;
  AMC.getCurrentStep = ahaGuide.getCurrentStep;
  AMC.isSettingUpRunnabot = ahaGuide.isSettingUpRunnabot;
  AMC.isAddingFirstRepo = ahaGuide.isAddingFirstRepo;
  AMC.isAddingFirstBranch = ahaGuide.isAddingFirstBranch;
  AMC.getFurthestSubstep = ahaGuide.furthestSubstep;
  AMC.getClassForSubstep = ahaGuide.getClassForSubstep;
  AMC.hasInstances = false;
  AMC.accountHasRepos = false;
  AMC.currentOrg = currentOrg;

  fetchInstancesByPod()
    .then(function (instances) {
      if (instances.length) {
        AMC.hasInstances = true;
      }
    });

  loading('fetchAccountRepos', true);
  fetchOwnerRepos(currentOrg.github.oauthName())
    .then(function (ownerRepos) {
      AMC.accountHasRepos = ownerRepos.models.length;
      loading('fetchAccountRepos', false);
    });

  ahaGuide.updateTracking();

  var repoMapping = {
    nodejs: 'node-starter',
    python: 'python-starter',
    ruby: 'ruby-starter'
  };

  function findRepo (repoName, count) {
    count = count || 0;
    if (count > 10) {
      return $q.reject('We were unable to find the repo we just forked. Please try again!');
    }
    return fetchOwnerRepos(currentOrg.github.oauthName())
      .then(function (repos) {
        var repoModel = repos.models.find(function (repo) {
          return repo.attrs.name === repoName;
        });
        if (repoModel) {
          return repoModel;
        }
        return $timeout(function () {
          return findRepo(repoName, ++count);
        }, 100);
      });
  }

  AMC.startDemo = function (stackName) {
    loading('startDemo', true);
    var loadingName = 'startDemo' + stackName.charAt(0).toUpperCase() + stackName.slice(1);
    loading(loadingName, true);
    github.forkRepo('RunnableDemo', repoMapping[stackName], currentOrg.github.oauthName())
      .then(function () {
        return findRepo(repoMapping[stackName]);
      })
      .then(function (repoModel) {
        return $q.all({
          repoBuildAndBranch: createNewBuildAndFetchBranch(currentOrg.github, repoModel, '', false),
          stacks: fetchStackInfo()
        });
      })
      .then(function (promiseResults) {
        var repoBuildAndBranch = promiseResults.repoBuildAndBranch;
        repoBuildAndBranch.instanceName = repoMapping[stackName];
        var selectedStack = promiseResults.stacks.find(function (stack) {
          return stack.key === stackName;
        });
        selectedStack.selectedVersion = selectedStack.suggestedVersion;
        repoBuildAndBranch.defaults = {
          selectedStack: selectedStack,
          startCommand: selectedStack.startCommand[0],
          keepStartCmd: true,
          step: 3
        };
        close();
        return ModalService.showModal({
          controller: 'SetupServerModalController',
          controllerAs: 'SMC',
          templateUrl: 'setupServerModalView',
          inputs: angular.extend({
            dockerfileType: false,
            instanceName: null,
            repo: null,
            build: null,
            masterBranch: null,
            defaults: {}
          }, repoBuildAndBranch)
        });
      })
      .catch(errs.handler)
      .finally(function () {
        loading('startDemo', false);
        loading(loadingName, false);
      });
  };

  AMC.addOwnRepo = function () {
    close();
    ModalService.showModal({
      controller: 'NewContainerModalController',
      controllerAs: 'MC', // Shared
      templateUrl: 'newContainerModalView'
    });
  };

  AMC.getStarted = function () {
    close();
  };
}
