
'use strict';

require('app')
  .controller('AhaSidebarController', AhaSidebarController);

function AhaSidebarController(
  $scope,
  $rootScope,
  serviceAhaGuide
) {
  
  var ASC = this;
  $rootScope.ahaGuide.completedMilestones = serviceAhaGuide.getAhaMilestones();
  console.log($rootScope.ahaGuide);

  ASC.toggleOverview = function() {
    $rootScope.ahaGuide.showOverview = !$rootScope.ahaGuide.showOverview;
    ASC.toggleSidebar();
  };

  ASC.toggleSidebar = function() {
    $rootScope.ahaGuide.showSidebar = !$rootScope.ahaGuide.showSidebar;
  };

  if ($rootScope.ahaGuide.completedMilestones.aha1) {
    $rootScope.ahaGuide.showOverview = false;
  } else {
    $rootScope.ahaGuide.showOverview = true;
  }

}
