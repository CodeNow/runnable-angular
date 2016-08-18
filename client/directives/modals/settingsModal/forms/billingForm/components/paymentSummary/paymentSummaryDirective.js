'use strict';

require('app').directive('paymentSummary', paymentSummary);

function paymentSummary(
  $q,
  currentOrg,
  fetchPaymentMethod,
  fetchPlan,
  loading,
  moment
) {
  return {
    restrict: 'A',
    templateUrl: 'paymentSummaryView',
    scope: {
      showNext: '='
    },
    link: function ($scope) {
      $scope.currentOrg = currentOrg;
      $scope.planMapping = {
        'starter': 'Starter',
        'standard': 'Standard',
        'plus': 'Plus'
      };
      loading('billingForm', true);
      $q.all([
        fetchPaymentMethod(),
        fetchPlan()
      ])
        .then(function (data) {
          $scope.paymentMethod = data[0];
          $scope.plan = data[1].next.plan;
        })
        .finally(function () {
          loading('billingForm', false);
        });

      $scope.calculatePlanPrice = function () {
        if (!$scope.plan) {
          return null;
        }
        return $scope.plan.price * $scope.plan.userCount;
      };

      $scope.getTrialEndDate = function () {
        return moment(currentOrg.poppa.attrs.trialEnd).format('MMM Do, YYYY');
      };
    }
  };
}
