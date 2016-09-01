
'use strict';

require('app')
  .controller('AhaSidebarController', AhaSidebarController);

function AhaSidebarController(
  $scope,
  $rootScope,
  ahaGuide
) {
  
  var ASC = this;

  ASC.toggleOverview = function() {
    $rootScope.ahaGuide.ahaGuideToggles.showOverview = !$rootScope.ahaGuide.ahaGuideToggles.showOverview;
    ASC.toggleSidebar();
  };

  ASC.toggleSidebar = function() {
    $rootScope.ahaGuide.ahaGuideToggles.showSidebar = !$rootScope.ahaGuide.ahaGuideToggles.showSidebar;
  };
}
