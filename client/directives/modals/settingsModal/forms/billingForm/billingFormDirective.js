'use strict';

require('app').directive('billingForm', billingForm);

function billingForm(
  $rootScope
) {
  return {
    restrict: 'A',
    templateUrl: 'billingForm',
    link: function ($scope, element) {
      element.on('$destroy', function () {
        $scope.SEMC.showFooter = true;
      });
      $scope.$on('changed-animated-panel', function (event, panelName) {
        if (panelName !== 'billingForm') {
          $scope.SEMC.showFooter = false;
        } else {
          $scope.SEMC.showFooter = true;
        }
      });

      $scope.$broadcast('go-to-panel', $scope.SEMC.subTab || 'billingForm', 'immediate');

      $scope.activeAccount = $rootScope.dataApp.data.activeAccount;
      $scope.actions = {
        save: function () {
          $scope.$broadcast('go-to-panel', 'confirmationForm');
        },
        cancel: function () {
          $scope.$broadcast('go-to-panel', 'billingForm', 'back');
        }
      };
    }
  };
}
