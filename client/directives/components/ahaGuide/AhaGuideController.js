
'use strict';

require('app')
  .controller('AhaGuideController', AhaGuideController);

function AhaGuideController(
  $scope,
  $rootScope,
  $timeout,
  serviceAhaGuide
) {

  var AHA = this;
  var buildLogListener;

  var tabListener = $scope.$on('updatedTab', function(event, tabName) {
    if (AHA.state.subStepIndex > 5) {
      tabListener();
    } else {
      updateCaption(tabName);
    }
  });

  var alertListener = $scope.$on('alert', function(event, alert) {
    // alerts on container creation success
    if (alert.type === 'success') {
      updateCaption('logs');
      alertListener();

      buildLogListener = $scope.$on('buildStatusUpdated', function(event, buildStatus) {
        handleBuildUpdate(buildStatus);
      });
    }
  });

  AHA.state = {
    hideMenu: false,
    isBuildSuccessful: false,
    mainStep: $scope.stepIndex,
    subStep: $scope.subStep,
    subStepIndex: $scope.subStepIndex,
    showError: false
  };

  // get steps from service
  AHA.state.steps = serviceAhaGuide.getSteps();

  // get the current milestone
  var currentMilestone = AHA.state.steps[AHA.state.mainStep];
  // get the bound of the caption array so we know when to stop

  AHA.state.title = currentMilestone.title;
  AHA.state.caption = currentMilestone.subSteps[AHA.state.subStep].caption;
  AHA.state.className = currentMilestone.subSteps[AHA.state.subStep].className;

  // update steps and initiate digest loop
  function updateCaption(status) {
    if (!currentMilestone.subSteps[status]) {
      return;
    }
    if (status === 'dockLoaded') {
      $rootScope.animatedPanelListener();
    }
    AHA.state.subStep = status;
    AHA.state.subStepIndex = currentMilestone.subSteps[status].step;
    AHA.state.caption = currentMilestone.subSteps[status].caption;
    AHA.state.className = currentMilestone.subSteps[status].className;
  }

  function handleBuildUpdate(update) { // building, running, starting
    console.log(update);
    var buildStatus = update.status;
    AHA.state.containerHostname = update.containerHostname;
    if (buildStatus === 'failed' || buildStatus === 'buildFailed') {
      AHA.state.showError = true;
    } else if (buildStatus === 'starting') {
        addVerificationListeners();
    }
    updateBuildStatus(buildStatus);
  }

  function updateBuildStatus(buildStatus) {
    AHA.state.buildStatus = buildStatus;
    AHA.state.caption = currentMilestone.buildStatus[buildStatus] || AHA.state.caption;
    console.log(AHA.state.caption);
  }

  function addVerificationListeners() {
    if (!$rootScope.doneListener) {
      $rootScope.doneListener = $rootScope.$on('close-popovers', function() {
        $rootScope.doneListener();
        updateCaption('complete');
        $rootScope.featureFlags.aha1 = false;
        $rootScope.featureFlags.aha2 = true;
      })
    }

    $timeout(function() {
      if (AHA.state.showError === false && !AHA.state.isBuildSuccesful) {
        AHA.state.isBuildSuccessful = true;
        buildLogListener();
        updateCaption('success');
      } else {
        AHA.state.isBuildSuccessful = false;
      }
    }, 5000);
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
  });
  
  $rootScope.animatedPanelListener = $rootScope.$on('changed-animated-panel', function (e, panel) {
    updateCaption(panel);
  });

}

