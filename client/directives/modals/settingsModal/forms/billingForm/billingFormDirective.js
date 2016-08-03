'use strict';

require('app').directive('billingForm', billingForm);

function billingForm() {
  return {
    restrict: 'A',
    templateUrl: 'billingForm',
    link: function ($scope, element) {
      $scope.actions = {
        trial: {
          save: function () {
            $scope.$broadcast('go-to-panel', 'confirmationForm');
          },
          back: function () {
            $scope.$broadcast('go-to-panel', 'confirmationForm');
          }
        },
        update: {
          save: function () {
            $scope.$broadcast('go-to-panel', 'confirmationForm');
          },
          cancel: function () {
            $scope.$broadcast('go-to-panel', 'billingForm', 'back');
          }
        }
      };
    }
  };
}
