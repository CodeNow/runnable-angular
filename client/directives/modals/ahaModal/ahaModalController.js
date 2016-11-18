'use strict';

require('app')
  .controller('AhaModalController', AhaModalController);

function AhaModalController(
  $q,
  $timeout,
  $rootScope,
  ahaGuide,
  currentOrg,
  serverCreateService,
  fetchInstancesByPod,
  fetchOwnerRepos,
  keypather,
  loading,
  ModalService,

  // Injected inputs
  close
) {
  var AMC = this;
  AMC.actions = {
    forceClose: close,
    close: function (endGuide) {
      if (!$rootScope.featureFlags.demoProject || AMC.hasInstances || !AMC.isAddingFirstRepo()) {
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

  AMC.addOwnRepo = function () {
    close();
    ModalService.showModal({
      controller: 'NewContainerModalController',
      controllerAs: 'NCMC',
      templateUrl: 'newContainerModalView'
    });
  };

  AMC.getStarted = function () {
    close();
  };
  
  AMC.startDemo = function (stackName) {
    return serverCreateService(stackName)
      .then(function (repoBuildAndBranch) {
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
      });
  };
}
