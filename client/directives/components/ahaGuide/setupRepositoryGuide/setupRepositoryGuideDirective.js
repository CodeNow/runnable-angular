'use strict';

require('app')
  .directive('setupRepositoryGuide', setupRepositoryGuide);

function setupRepositoryGuide(
  ahaGuide
) {
  return {
    restrict: 'A',
    templateUrl: 'setupRepositoryGuideView',
    scope: true,
    link: function ($scope, elem, attrs) {
      $scope.ahaGuide = {
        steps: ahaGuide.steps,
        getCurrentStep: ahaGuide.getCurrentStep
      };
    }
  };
}
