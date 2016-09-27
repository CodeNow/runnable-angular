'use strict';

require('app')
  .directive('setupRepositoryGuide', setupRepositoryGuide);

function setupRepositoryGuide(
  ahaGuide,
  intercom
) {
  return {
    restrict: 'A',
    templateUrl: 'setupRepositoryGuideView',
    scope: true,
    link: function ($scope) {
      $scope.ahaGuide = {
        steps: ahaGuide.steps,
        getCurrentStep: ahaGuide.getCurrentStep
      };
    }
  };
}
