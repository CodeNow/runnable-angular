'use strict';

require('app')
  .controller('AhaModalController', AhaModalController);

function AhaModalController(
  ahaGuide,

  // Injected inputs
  showOverview
) {
  var AMC = this;
  AMC.showOverview = showOverview;

  AMC.steps = ahaGuide.steps;
  AMC.getCurrentStep = ahaGuide.getCurrentStep;
  AMC.isSettingUpRunnabot = ahaGuide.isSettingUpRunnabot;
  AMC.isAddingFirstRepo = ahaGuide.isAddingFirstRepo;
  AMC.isAddingFirstBranch = ahaGuide.isAddingFirstBranch;
  AMC.getFurthestSubstep = ahaGuide.furthestSubstep;
  AMC.getClassForSubstep = ahaGuide.getClassForSubstep;
  ahaGuide.updateTracking();
}
