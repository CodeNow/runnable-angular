'use strict';

require('app').directive('changePaymentForm', changePaymentForm);

function changePaymentForm() {
  return {
    restrict: 'A',
    templateUrl: 'changePaymentForm',
    controller: 'ChangePaymentFormController as CPFC',
    bindToController: true,
    scope: {
      back: '=?',
      cancel: '=?',
      save: '=',
      updating: '@'
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
        if (!$scope.paymentForm.ccExpMonth.$touched && !$scope.paymentForm.ccExpYear.$touched) {
          return true;
        }
        return $scope.paymentForm.ccExpMonth.$valid &&
          $scope.paymentForm.ccExpYear.$valid &&
          !$scope.paymentForm.$error.ccExp;
      };
    }
  };
}
