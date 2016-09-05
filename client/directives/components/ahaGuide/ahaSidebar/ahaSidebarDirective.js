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
    }
  };
}
