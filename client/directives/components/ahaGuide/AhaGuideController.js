
'use strict';

require('app')
  .controller('AhaGuideController', AhaGuideController);

function AhaGuideController(
  $scope,
  $rootScope,
  serviceAhaGuide
) {

  var AHA = this;

  var previousTab;
  var buildLogListener;

  var tabListener = $scope.$on('updatedTab', function(event, tabName) {
    if (tabName === 'logs') {
      tabListener();
      buildLogListener = $scope.$on('buildStatusUpdated', function(event, buildStatus) {
        if (buildStatus === 'failed' || buildStatus === 'buildFailed') {
          AHA.state.showError = true;
        }
        updateBuildStatus(buildStatus);
      })
    }
    updateCaption(tabName);
  });

  AHA.state = {
    mainStep: $scope.stepIndex,
    subStep: $scope.subStep,
    subStepIndex: $scope.subStepIndex,
    hideMenu: false
  };

  // get steps from service
  AHA.state.steps = serviceAhaGuide.getSteps();

  // get the current milestone
  var currentMilestone = AHA.state.steps[AHA.state.mainStep];
  // get the bound of the caption array so we know when to stop

  AHA.state.title = currentMilestone.title;
  AHA.state.caption = currentMilestone.subSteps[AHA.state.subStep].caption;
  AHA.state.className = currentMilestone.subSteps[AHA.state.subStep].className

  // update steps and initiate digest loop
  function updateCaption(status) {
    if (!currentMilestone.subSteps[status]) {
      return;
    }
    if (status === 'dockLoaded') {
      $rootScope.animatedPanelListener();
    }
    AHA.state.subStep = status;
    AHA.state.caption = currentMilestone.subSteps[status].caption;
    AHA.state.className = currentMilestone.subSteps[status].className
  }

  function updateBuildStatus(buildStatus) {
    AHA.state.buildStatus = buildStatus;
    AHA.state.caption = currentMilestone.buildStatus[buildStatus];
  }

  // handle the panel event
  function incrementStep(panel) {
    // AHA.state.subStep = currentMilestone.panelSteps[panel];
    
    // if (AHA.state.subStep === undefined) {
    //   AHA.state.subStep = 0;
    // }

    // if either the dockLoaded is fired or we've reached the end
    
    
  }

  if ($rootScope.animatedPanelListener) {
    $rootScope.animatedPanelListener();
  }
  
  $rootScope.animatedPanelListener = $rootScope.$on('changed-animated-panel', function (e, panel) {
    updateCaption(panel);
  });

};

