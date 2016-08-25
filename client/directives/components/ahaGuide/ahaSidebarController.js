
'use strict';

require('app')
  .controller('AhaSidebarController', AhaSidebarController);

function AhaSidebarController(
  $scope,
  $rootScope,
  serviceAhaGuide
) {
  console.log('instantiated');
  var ASC = this;
  var showOverview;
  $rootScope.ahaGuide.completedMilestones = serviceAhaGuide.getAhaMilestones();

  ASC.toggleOverview = function() {
    ASC.state.showOverview = !ASC.state.showOverview;
    $rootScope.ahaGuide.showOverview = ASC.state.showOverview;
    ASC.toggleSidebar();
  };

  ASC.toggleSidebar = function() {
    ASC.state.showSidebar = !ASC.state.showSidebar;
    $rootScope.ahaGuide.showSidebar = ASC.state.showSidebar;
  };

  console.log($rootScope.ahaGuide.completedMilestones);
  if ($rootScope.ahaGuide.completedMilestones.aha1) {
    showOverview = false;
  } else {
    showOverview = true;
  }
  ASC.state = {
    showOverview: showOverview,
    showSidebar: true
  };

}
