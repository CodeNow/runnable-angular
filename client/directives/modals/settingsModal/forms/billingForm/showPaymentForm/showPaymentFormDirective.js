'use strict';

require('app').directive('showPaymentForm', showPaymentForm);

function showPaymentForm(
  fetchPaymentMethod,
  keypather,
  loading
) {
  return {
    restrict: 'A',
    templateUrl: 'showPaymentForm',
    link: function ($scope, element) {
      loading('billingForm', true);
      fetchPaymentMethod()
        .then(function (paymentMethod) {
          $scope.paymentMethod = paymentMethod;
        })
        .finally(function () {
          loading('billingForm', false);
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
