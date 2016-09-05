'use strict';

require('app')
  .directive('addBranchGuide', addBranchGuide);

function addBranchGuide(
  ahaGuide
) {
  return {
    restrict: 'A',
    templateUrl: 'addBranchGuideView',
    scope: true,
    link: function ($scope, elem, attrs) {
      $scope.ahaGuide = {
        steps: ahaGuide.steps,
        getCurrentStep: ahaGuide.getCurrentStep
      };
      $scope.subStep = $scope.AGC.state.subStep;
    }
  };
}
