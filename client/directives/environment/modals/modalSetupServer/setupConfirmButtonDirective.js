'use strict';

require('app')
  .directive('setupConfirmButton', function setupConfirmButton($rootScope) {
    return {
      restrict: 'A',
      link: function ($scope, elem, attrs) {

        $scope.$on('updateStep', updateStepHandler);
        updateStepHandler(null, 1);

        var step3Copy;
        var step4Copy;
        var step4ClosesModal;
        if ($rootScope.featureFlags.rebuildFlow) {
          step3Copy = 'Save & Build';
          step4Copy = 'Save & Build';
          step4ClosesModal = false;
        } else {
          step3Copy = 'Start Build';
          step4Copy = 'Create Container';
          step4ClosesModal = true;
        }

        function updateStepHandler (event, newStep) {
          $scope.step = newStep;
          if ($scope.step < 3) {
            $scope.buttonText = 'Next';
            $scope.buttonClosesModal = false;
          } else if ($scope.step === 3) {
            $scope.buttonText = step3Copy;
            $scope.buttonClosesModal = false;
          } else if ($scope.step >= 4) {
            $scope.buttonText = step4Copy;
            $scope.buttonClosesModal = step4ClosesModal;
          }
        }

      }
     };
  });
