'use strict';

require('app').directive('billingForm', billingForm);

function billingForm(
  fetchPaymentMethod,
  loading
) {
  return {
    restrict: 'A',
    templateUrl: 'billingForm',
    link: function ($scope, element) {
      element.on('$destroy', function() {
        $scope.SEMC.showFooter = true;
      });
      $scope.activeAccount = $scope.dataApp.data.activeAccount;
      if ($scope.activeAccount.isInTrial()) {
        loading('billingForm', true);
        fetchPaymentMethod()
          .then(function (paymentMethod) {
            $scope.paymentMethod = paymentMethod;
          })
          .finally(function () {
            loading('billingForm', false);
          });
      }
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
