
'use strict';

require('app')
  .controller('AhaSidebarController', AhaSidebarController);

function AhaSidebarController(
  $rootScope,
  ahaGuide
) {
  var ASC = this;

  ASC.steps = ahaGuide.steps;
  ASC.getCurrentStep = ahaGuide.getCurrentStep;

  ASC.toggleOverview = function () {
    $rootScope.ahaGuide.ahaGuideToggles.showOverview = !$rootScope.ahaGuide.ahaGuideToggles.showOverview;
    ASC.toggleSidebar();
  };

  ASC.toggleSidebar = function () {
    $rootScope.ahaGuide.ahaGuideToggles.showSidebar = !$rootScope.ahaGuide.ahaGuideToggles.showSidebar;
  };
}
