'use strict';

require('app')
  .directive('ahaSidebar', ahaSidebar);

function ahaSidebar(
  ahaGuide
) {
  return {
    restrict: 'A',
    templateUrl: 'ahaSidebarView',
    scope: {
      toggleSidebar: '=',
      showOverview: '='
    },
    link: function ($scope) {
      $scope.steps = ahaGuide.steps;
      $scope.getCurrentStep = ahaGuide.getCurrentStep;
      $scope.isSettingUpRunnabot = ahaGuide.isSettingUpRunnabot;
      $scope.isAddingFirstRepo = ahaGuide.isAddingFirstRepo;
      $scope.isAddingFirstBranch = ahaGuide.isAddingFirstBranch;
      $scope.getFurthestSubstep = ahaGuide.furthestSubstep;
      $scope.getClassForSubstep = ahaGuide.getClassForSubstep;
      ahaGuide.updateTracking();
    }
  };
}
