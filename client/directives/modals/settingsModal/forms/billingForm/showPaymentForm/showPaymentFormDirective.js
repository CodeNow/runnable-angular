'use strict';

require('app').directive('showPaymentForm', showPaymentForm);

function showPaymentForm(
  $rootScope,
  fetchPaymentMethod,
  keypather,
  loading,
  currentOrg,
  moment
) {
  return {
    restrict: 'A',
    templateUrl: 'showPaymentForm',
    link: function ($scope) {
      $scope.currentOrg = currentOrg;
      $scope.hasUpdated = false;
      $rootScope.$on('updated-payment-method', function () {
        fetchPaymentMethod()
          .then(function (paymentMethod) {
            $scope.hasUpdated = true;
            $scope.paymentMethod = paymentMethod;
          });
      });
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

      $scope.getNextPaymentDate = function () {
        var nextPaymentDate;
        if (currentOrg.poppa.isInTrial()) {
          nextPaymentDate = currentOrg.poppa.attrs.trialEnd;
        } else if (currentOrg.poppa.isInActivePeriod()) {
          nextPaymentDate = currentOrg.poppa.attrs.activePeriodEnd;
        }
        return moment(nextPaymentDate).format('MMM Do, YYYY');
      };
    }
  };
}
