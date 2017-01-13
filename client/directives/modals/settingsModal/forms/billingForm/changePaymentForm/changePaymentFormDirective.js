'use strict';

require('app').directive('changePaymentForm', changePaymentForm);

function changePaymentForm(
  moment
) {
  return {
    restrict: 'A',
    templateUrl: 'changePaymentForm',
    controller: 'ChangePaymentFormController as CPFC',
    bindToController: true,
    scope: {
      back: '=?',
      cancel: '=?',
      close: '=?',
      save: '=',
      updating: '='
    },
    link: function ($scope) {
      var typeMapping = {
        'American Express': 'amex',
        'Visa': 'visa',
        'MasterCard': 'mastercard',
        'JCB': 'jcb'
      };
      $scope.getCardClass = function () {
        return typeMapping[$scope.paymentForm.cardNumber.$ccEagerType];
      };
      $scope.isCCExpValid = function () {
        if (!$scope.paymentForm.ccExpMonth.$dirty && !$scope.paymentForm.ccExpYear.$dirty) {
          return true;
        }
        return $scope.paymentForm.ccExpMonth.$valid &&
          $scope.paymentForm.ccExpYear.$valid &&
          !$scope.paymentForm.$error.ccExp;
      };
      $scope.getBillingDate = function () {
        return moment($scope.CPFC.currentOrg.poppa.attrs.activePeriodEnd).format('MMM Do, YYYY');
      };
    }
  };
}
