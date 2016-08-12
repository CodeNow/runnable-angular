'use strict';

require('app').directive('paymentSummary', paymentSummary);

function paymentSummary(
  fetchPlan,
  fetchPaymentMethod,
  loading,
  moment,
  $q
) {
  return {
    restrict: 'A',
    templateUrl: 'paymentSummaryView',
    scope: {
      showNext: '='
    },
    link: function ($scope, element) {
      $scope.activeAccount = $scope.$root.dataApp.data.activeAccount;
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
        return moment.utc($scope.activeAccount.attrs.trialEnd * 1000).format('MMM Do, YYYY');
      };
    }
  };
}
