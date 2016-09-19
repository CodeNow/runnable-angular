
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
  keypather,
  patchOrgMetadata
) {
  var AGC = this;
  var animatedPanelListener = angular.noop;

  if (keypather.has(currentOrg, 'poppa.attrs.id') && ahaGuide.isAddingFirstRepo()) {
    fetchInstancesByPod()
      .then(function (instances) {
        if (instances.models.length) {
          var config = checkContainerInstances(instances);
          if (!config.workingRepoInstance) {
            AGC.showError = true;
            AGC.errorState = 'nonRunningContainer';
            $rootScope.$broadcast('ahaGuideError', {
              cause: AGC.errorState
            });
          } else if (ahaGuide.isAddingFirstRepo() && AGC.subStepIndex === 7) {
            callPopover(config);
          }
        } else if (ahaGuide.isAddingFirstBranch()) {
          AGC.showError = true;
        }
      })
      .catch(errs.handler);
  }

  $scope.$on('alert', function (event, alert) {
    // alerts on container creation success
    if (alert.text === 'Container Created' && alert.type === 'success') {
      updateCaption('logs');
      fetchInstancesByPod()
        .then(function (instances) {
          var config = checkContainerInstances(instances);
          if (config) {
            callPopover(config);
          }
        })
        .catch(errs.handler);
    }
  });

  var buildLogListener = $scope.$on('buildStatusUpdated', function(event, buildStatus) {
    if (ahaGuide.isAddingFirstRepo()) {
      handleBuildUpdate(buildStatus);
    }
  });

  $scope.$on('ahaGuideError', function(event, info) {
    if (info.cause === 'exitedEarly') {
      AGC.showError = true;
      AGC.errorState = info.cause;
      updateCaption('exitedEarly');
    } else if (info.cause === 'nonRunningContainer') {
      AGC.showError = true;
      AGC.errorState = info.cause;
    } else if (info.cause === 'buildFailed') {
      AGC.showError = true;
      AGC.errorState = info.cause;
    } else if (info.isClear) {
      AGC.showError = false;
      AGC.errorState = null;
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
  AGC.errorState = $scope.errorState;

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
    AGC.className = currentMilestone.subSteps[status].className;
    AGC.subStepIndex = currentMilestone.subSteps[status].step;
  }

  function handleBuildUpdate(update) {
    var buildStatus = update.status;
    if (buildStatus === 'buildFailed' || buildStatus === 'stopped' || buildStatus === 'crashed') {
      AGC.showError = true;
      $rootScope.$broadcast('ahaGuideError', {
        cause: 'buildFailed'
      });
    } else if (buildStatus === 'starting') {
      AGC.showError = false;
    } else if (buildStatus === 'running') {
      AGC.isBuildSuccessful = true;
      updateCaption('success');
      $rootScope.$broadcast('ahaGuideError', {
        isClear: true
      });
      currentMilestone.isBuildSuccessful = true;
    }
    AGC.buildStatus = buildStatus;
    AGC.caption = currentMilestone.buildStatus[buildStatus] || AGC.caption;
  }

  function checkContainerInstances (instances) {
    if (!instances) {
      return null;
    }
    var config = {};
    instances.forEach(function(instance) {
      if (instance.getRepoName() && instance.status() === 'running') {
        config.workingRepoInstance = true;
      } else if (!instance.getRepoName()) {
        config.nonRepoInstance = true;
      }
    });
    return config;
  }

  function callPopover(config) {
    if (config.workingRepoInstance && config.nonRepoInstance) {
      $rootScope.$broadcast('launchAhaNavPopover');
    } else if (config.workingRepoInstance) {
      $rootScope.$broadcast('show-add-services-popover');
    }
  }

  $scope.$on('$destroy', function () {
    animatedPanelListener();
    if (AGC.subStepIndex === 7 && !AGC.isBuildSuccessful) {
      $rootScope.$broadcast('ahaGuideError', {
        cause: 'exitedEarly'
      });
    } else if (ahaGuide.isAddingFirstRepo() && AGC.subStep === 'success') {
      $rootScope.$broadcast('show-add-services-popover');
    }
  });

  animatedPanelListener = $rootScope.$on('changed-animated-panel', function (e, panel) {
    updateCaption(panel);
  });

  AGC.popoverActions = {
    endGuide: ahaGuide.endGuide,
    showSidebar: function () {
      $rootScope.$broadcast('close-popovers');
      $rootScope.$broadcast('show-aha-sidebar');
    }
  };
}
