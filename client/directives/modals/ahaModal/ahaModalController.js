'use strict';

require('app')
  .controller('AhaModalController', AhaModalController);

function AhaModalController(
  $q,
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

  fetchInstancesByPod()
    .then(function (instances) {
      if (instances.length) {
        AMC.hasInstances = true;
      }
    });

  // accountHasRepos

  ahaGuide.updateTracking();

  var repoMapping = {
    nodejs: 'node-starter',
    python: 'python-starter',
    ruby: 'ruby-starter'
  };

  AMC.startDemo = function (stackName) {
    loading('startDemo', true);
    github.forkRepo('RunnableDemo', repoMapping[stackName], currentOrg.github.oauthName())
      .then(function () {
        return fetchOwnerRepos(currentOrg.github.oauthName());
      })
      .then(function (repos) {
        var repoModel = repos.models.find(function (repo) {
          return repo.attrs.name === repoMapping[stackName];
        });
        if (!repoModel) {
          throw new Error('We were unable to find the repo we just forked. Please try again!');
        }
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
      });
  };

  AMC.addOwnRepo = function () {
    console.log('Add own repo!');
  };

  AMC.getStarted = function () {
    close();
  };
}
