
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
  if (keypather.has(currentOrg, 'poppa.attrs.id')) {
    fetchInstancesByPod()
      .then(function (instances) {
        instances.forEach(function (instance) {
          var repoName = instance.getRepoName();
          if (instance.status() === 'running' && repoName) {
            $rootScope.$broadcast('launchAhaNavPopover');
          } else if (repoName){
            AGC.showError = true;
            AGC.errorState = 'nonRunningContainer';
            $rootScope.$broadcast('ahaGuideError', {
              cause: AGC.errorState
            });
          }
        });
      })
      .catch(errs.handler);
  }

  var alertListener = $scope.$on('alert', function (event, alert) {
    // alerts on container creation success
    if (alert.type === 'success') {
      updateCaption('logs');
      alertListener();
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
    }
    AGC.buildStatus = buildStatus;
    AGC.caption = currentMilestone.buildStatus[buildStatus] || AGC.caption;
  }

  $scope.$on('$destroy', function () {
    animatedPanelListener();
    if (AGC.subStepIndex === 7 && !AGC.isBuildSuccessful) {
      $rootScope.$broadcast('ahaGuideError', {
        cause: 'exitedEarly'
      });
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
