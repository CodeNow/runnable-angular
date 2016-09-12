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
      $scope.askEngineers = function () {
        window.Intercom(
          'showNewMessage',
          'I’m having trouble getting my first container up and running.'
        );
      };
    }
  };
}
