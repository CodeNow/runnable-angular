'use strict';

require('app')
  .controller('AhaModalController', AhaModalController);

function AhaModalController(
  ahaGuide,
  createNewBuildAndFetchBranch,
  currentOrg,
  errs,
  fetchOwnerRepos,
  github,
  loading,
  ModalService,

  // Injected inputs
  showOverview,
  close
) {
  var AMC = this;
  AMC.actions = {
    close: angular.noop
  };
  AMC.showOverview = showOverview;

  AMC.steps = ahaGuide.steps;
  AMC.getCurrentStep = ahaGuide.getCurrentStep;
  AMC.isSettingUpRunnabot = ahaGuide.isSettingUpRunnabot;
  AMC.isAddingFirstRepo = ahaGuide.isAddingFirstRepo;
  AMC.isAddingFirstBranch = ahaGuide.isAddingFirstBranch;
  AMC.getFurthestSubstep = ahaGuide.furthestSubstep;
  AMC.getClassForSubstep = ahaGuide.getClassForSubstep;
  AMC.accountHasRepos = false;
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
        return createNewBuildAndFetchBranch(currentOrg.github, repoModel, '', false);
      })
      .then(function (repoBuildAndBranch) {
        repoBuildAndBranch.instanceName = repoMapping[stackName];
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
            masterBranch: null
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
}
