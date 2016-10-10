'use strict';

require('app').directive('progress', progress);

function progress(
) {
  return {
    restrict: 'A',
    templateUrl: 'progressView',
    scope: {
      steps: '=',
      activeStep: '=',
      backMethod: '=?'
    },
    link: function ($scope) {
      $scope.stepArr = new Array($scope.steps);
    }
  };
}
