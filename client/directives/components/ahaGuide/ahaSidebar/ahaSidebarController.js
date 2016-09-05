
'use strict';

require('app')
  .controller('AhaSidebarController', AhaSidebarController);

function AhaSidebarController(
  ahaGuide
) {
  var ASC = this;

  ASC.steps = ahaGuide.steps;
  ASC.getCurrentStep = ahaGuide.getCurrentStep;
}
