
'use strict';

require('app')
  .controller('AhaGuideController', AhaGuideController);

function AhaGuideController(
  $scope,
  $rootScope,
  $timeout,
  ahaGuide
) {

  var AGC = this;
  if (!$rootScope.ahaGuide) {
    $rootScope.ahaGuide = {};
  }

  AGC.exitingEarly = exitingEarly;

  var alertListener = $scope.$on('alert', function(event, alert) {
    // alerts on container creation success
    if (alert.type === 'success') {
      updateCaption('logs');
      alertListener();
    }
  });

  var buildLogListener = $scope.$on('buildStatusUpdated', function(event, buildStatus) {
    handleBuildUpdate(buildStatus);
  });

  var exitedEarlyListener = $scope.$on('exitedEarly', function() {
    exitingEarly();
  });

  var tabListener = $scope.$on('updatedTab', function(event, tabName) {
    if (AGC.state.subStepIndex > 5) {
      tabListener();
    } else {
      updateCaption(tabName);
    }
  });

  AGC.state = {
    hideMenu: false,
    isBuildSuccessful: false,
    mainStep: $scope.stepIndex,
    subStep: $scope.subStep,
    subStepIndex: $scope.subStepIndex,
    showError: $scope.errorState
  };

  // get steps from service
  AGC.state.steps = ahaGuide.getSteps();

  // get the current milestone
  var currentMilestone = AGC.state.steps[AGC.state.mainStep];
  // get the bound of the caption array so we know when to stop

  AGC.state.title = currentMilestone.title;
  AGC.state.caption = currentMilestone.subSteps[AGC.state.subStep].caption;
  AGC.state.className = currentMilestone.subSteps[AGC.state.subStep].className;

  // update steps and initiate digest loop
  function updateCaption(status) {
    if (!currentMilestone.subSteps[status]) {
      return;
    }
    if (status === 'dockLoaded') {
      $rootScope.animatedPanelListener();
    }
    AGC.state.subStep = status;
    AGC.state.subStepIndex = currentMilestone.subSteps[status].step;
    AGC.state.caption = currentMilestone.subSteps[status].caption;
    AGC.state.className = currentMilestone.subSteps[status].className;
  }

  function handleBuildUpdate(update) {
    console.log(update);
    var buildStatus = update.status;
    AGC.state.containerHostname = update.containerHostname;
    if (buildStatus === 'buildFailed' || buildStatus === 'stopped' || buildStatus === 'crashed') {
      AGC.state.showError = true;
    } else if (buildStatus === 'starting') {
      AGC.state.showError = false;
      addVerificationListeners(AGC.state.containerHostname);
    }
    updateBuildStatus(buildStatus);
  }

  function updateBuildStatus(buildStatus) {
    AGC.state.buildStatus = buildStatus;
    AGC.state.caption = currentMilestone.buildStatus[buildStatus] || AGC.state.caption;
  }

  function addVerificationListeners(containerHostname) {
    if (!$rootScope.doneListener) {
      $rootScope.doneListener = $rootScope.$on('close-popovers', function() {
        $rootScope.doneListener();
        updateCaption('complete');
        $rootScope.ahaGuide.ahaGuideToggles.exitedEarly = false;
        $rootScope.ahaGuide.ahaGuideToggles.showPopover = true;
      });
    }
  }

  function exitingEarly() {
    exitedEarlyListener();
    AGC.state.showError = true;
    updateCaption('exitedEarly');
    $rootScope.ahaGuide.completedMilestones.aha1 = true;
  }

  // we need to unregister this animated panel listener if it exists
  // to avoid duplication 
  if ($rootScope.animatedPanelListener) {
    $rootScope.animatedPanelListener();
  }

  $scope.$on('$destroy', function() {
    if ($rootScope.animatedPanelListener) {
      $rootScope.animatedPanelListener();
    }
    if ($rootScope.doneListener) {
      $rootScope.doneListener();
    }
    if (AGC.state.subStep === 'dockLoaded') {
      $rootScope.ahaGuide.completedMilestones.aha0 = true;
    }
    if (AGC.state.subStepIndex === 7 && !AGC.state.isBuildSuccessful) {
      $rootScope.ahaGuide.ahaGuideToggles.exitedEarly = true;
      $rootScope.$broadcast('exitedEarly');
    }
  });
  
  $rootScope.animatedPanelListener = $rootScope.$on('changed-animated-panel', function (e, panel) {
    updateCaption(panel);
  });

}

