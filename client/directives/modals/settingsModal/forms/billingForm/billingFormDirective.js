'use strict';

require('app').directive('billingForm', billingForm);

function billingForm() {
  return {
    restrict: 'A',
    templateUrl: 'billingForm',
    link: function ($scope, element) {
      element.on('$destroy', function() {
        $scope.SEMC.showFooter = true;
      });

      $scope.actions = {
        trial: {
          save: function () {
            $scope.$broadcast('go-to-panel', 'confirmationForm');
          },
          back: function () {
            $scope.SEMC.showFooter = true;
            $scope.$broadcast('go-to-panel', 'confirmationForm');
          }
        },
        update: {
          save: function () {
            $scope.$broadcast('go-to-panel', 'confirmationForm');
          },
          cancel: function () {
            $scope.SEMC.showFooter = true;
            $scope.$broadcast('go-to-panel', 'billingForm', 'back');
          }
        }
      };
    }
  };
}