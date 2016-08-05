'use strict';

require('app').directive('showPaymentForm', showPaymentForm);

function showPaymentForm(
  fetchPaymentMethod,
  keypather
) {
  return {
    restrict: 'A',
    templateUrl: 'showPaymentForm',
    link: function ($scope, element) {
      fetchPaymentMethod()
        .then(function (paymentMethod) {
          $scope.paymentMethod = paymentMethod;
        });

      $scope.getPaymentImage = function () {
        var paymentMapping = {
          'Amex': 'amex',
          'Visa': 'visa',
          'Mastercard': 'mastercard',
          'JCB': 'jcb'
        };
        var brand = keypather.get($scope, 'paymentMethod.card.brand');
        if (paymentMapping[brand]) {
          return '/build/images/logos/credit-cards/logo-cc-' + paymentMapping[brand] + '.svg';
        }
        return '';
      };
    }
  };
}
