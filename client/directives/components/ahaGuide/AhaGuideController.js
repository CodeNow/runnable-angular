'use strict';

require('app')
  .controller('AhaGuideController', AhaGuideController);

function AhaGuideController(
  $scope,
  $rootScope,
  serviceAhaGuide
) {

  var AHA = this;

  // initialize this with the value passed in from the directive
  $scope.stepIndex = $scope.stepIndex || 0;
  // this should remain undefined for the first step, which will update when the animated panel loads
  $scope.subStepIndex = $scope.subStepIndex;

  // retain this for now. TODO remove state object
  AHA.state = $scope.state || {
    mainStep: $scope.stepIndex,
    subStep: $scope.subStepIndex,
    hideMenu: true
  };

  // get steps from service
  AHA.state.steps = serviceAhaGuide.getSteps();

  // get the bound of the caption array so we know when to stop
  var captionLimit = AHA.state.steps[AHA.state.mainStep].subStepCaptions.length;

  // update steps and initiate digest loop
  function updateStep() {
    AHA.state.title = AHA.state.steps[AHA.state.mainStep].title;
    AHA.state.caption = AHA.state.steps[AHA.state.mainStep].subStepCaptions[AHA.state.subStep];
  }

  updateStep();

  // handle the panel event
  function incrementStep(e, panel) {
    if (AHA.state.subStep !== undefined) {
      AHA.state.subStep++;
    } else {
      AHA.state.subStep = 0;
    }

    // if either the dockLoaded is fired or we've reached the end
    if (panel === 'dockLoaded' || AHA.state.subStep >= captionLimit) {
      AHA.state.subStep = captionLimit - 1;
      updateStep();
      animatedPanelListener();
      return;
    }
    updateStep();
  }

  var animatedPanelListener = $rootScope.$on('changed-animated-panel', function (e, panel) {
    incrementStep(e, panel);
  })

};
