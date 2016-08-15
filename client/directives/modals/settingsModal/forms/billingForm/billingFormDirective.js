'use strict';

require('app').directive('billingForm', billingForm);

function billingForm(
  $rootScope
) {
  return {
    restrict: 'A',
    templateUrl: 'billingForm',
    link: function ($scope, element) {
      element.on('$destroy', function() {
        $scope.SEMC.showFooter = true;
      });
      $scope.activeAccount = $rootScope.dataApp.data.activeAccount;
      $scope.actions = {
        save: function () {
          $scope.$broadcast('go-to-panel', 'confirmationForm');
        },
        cancel: function () {
          $scope.SEMC.showFooter = true;
          $scope.$broadcast('go-to-panel', 'billingForm', 'back');
        }
      };
    }
  };
}
