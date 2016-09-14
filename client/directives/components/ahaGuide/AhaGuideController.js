
'use strict';

require('app')
  .controller('AhaGuideController', AhaGuideController);

function AhaGuideController(
  $scope,
  $rootScope,
  ahaGuide,
  currentOrg,
  errs,
  fetchInstancesByPod,
  patchOrgMetadata
) {
  var AGC = this;
  var animatedPanelListener = angular.noop;

  AGC.instances = null;
  fetchInstancesByPod()
    .then(function (instances) {
      AGC.instances = instances;
      if (!instances.models.length) {
        patchOrgMetadata(currentOrg.poppa.id(), {
          metadata: {
            hasConfirmedSetup: false
          }
        });
      }
      updateCaption(AGC.subStep);
    })
    .catch(errs.handler);

  var alertListener = $scope.$on('alert', function (event, alert) {
    // alerts on container creation success
    if (alert.type === 'success') {
      updateCaption('logs');
      alertListener();
    }
  });

  $scope.$on('buildStatusUpdated', function(event, buildStatus) {
    if (ahaGuide.isAddingFirstRepo()) {
      handleBuildUpdate(buildStatus);
    }
  });

  $scope.$on('exitedEarly', function(event, didExitEarly) {
    if (didExitEarly) {
      AGC.showError = true;
      updateCaption('exitedEarly');
    }
  });

  var stopTabUpdate = $scope.$on('updatedTab', function(event, tabName) {
    if (AGC.subStepIndex > 5) {
      stopTabUpdate();
    } else {
      updateCaption(tabName);
    }
  });

  AGC.isInGuide = ahaGuide.isInGuide;
  AGC.hasConfirmedSetup = ahaGuide.hasConfirmedSetup;
  AGC.isBuildSuccessful = false;
  AGC.ahaGuide = ahaGuide;
  AGC.showError = $scope.showError;

  // get the current milestone
  var currentMilestone = ahaGuide.stepList[ahaGuide.getCurrentStep()];

  AGC.title = currentMilestone.title;
  updateCaption(AGC.subStep);

  // update steps and initiate digest loop
  function updateCaption(status) {
    if (!currentMilestone.subSteps[status]) {
      return;
    }
    if (status === 'dockLoaded') {
      animatedPanelListener();
    }
    AGC.subStep = status;
    AGC.subStepIndex = currentMilestone.subSteps[status].step;
    AGC.caption = currentMilestone.subSteps[status].caption;
    AGC.className = currentMilestone.subSteps[status].className;
  }

  function handleBuildUpdate(update) {
    var buildStatus = update.status;
    if (buildStatus === 'buildFailed' || buildStatus === 'stopped' || buildStatus === 'crashed') {
      AGC.showError = true;
    } else if (buildStatus === 'starting') {
      AGC.showError = false;
    } else if (buildStatus === 'running') {
      AGC.isBuildSuccessful = true;
      updateCaption('success');
      $rootScope.$broadcast('exitedEarly', false);
    }
    AGC.buildStatus = buildStatus;
    AGC.caption = currentMilestone.buildStatus[buildStatus] || AGC.caption;
  }

  $scope.$on('$destroy', function () {
    animatedPanelListener();
    if (AGC.subStepIndex === 7 && !AGC.isBuildSuccessful) {
      $rootScope.$broadcast('exitedEarly', true);
    }
    if (AGC.subStepIndex < 6) {
      $rootScope.$broadcast('changed-animated-panel', 'addRepository');
    }
  });

  animatedPanelListener = $rootScope.$on('changed-animated-panel', function (e, panel) {
    updateCaption(panel);
  });

  AGC.popoverActions = {
    endGuide: function () {
      $rootScope.$broadcast('close-popovers');
      return patchOrgMetadata(currentOrg.poppa.id(), {
        metadata: {
          hasAha: false
        }
      });
    },
    showSidebar: function () {
      $rootScope.$broadcast('close-popovers');
      $rootScope.$broadcast('show-aha-sidebar');
    }
  };
}
