'use strict';

require('app').directive('paymentSummary', paymentSummary);

function paymentSummary(
  fetchPlan,
  loading
) {
  return {
    restrict: 'A',
    templateUrl: 'paymentSummaryView',
    link: function ($scope, element) {
      $scope.activeAccount = $scope.dataApp.data.activeAccount;
      loading('billingForm', true);
      fetchPlan()
        .then(function (plan) {
          console.log(plan);
          $scope.plan = plan.next.plan;
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
    }
  };
}
