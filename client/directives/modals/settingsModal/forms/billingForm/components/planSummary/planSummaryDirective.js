'use strict';

require('app').directive('planSummary', planSummary);

function planSummary(
  fetchPlan,
  billingPlans,
  loading
) {
  return {
    restrict: 'A',
    templateUrl: 'planSummaryView',
    link: function ($scope) {
      loading('billingForm', true);
      var isDiscounted;
      fetchPlan()
        .then(function (plan) {
          isDiscounted = !!plan.discount;
          $scope.plan = billingPlans[plan.next.id];
        })
        .finally(function () {
          loading('billingForm', false);
        });

      $scope.getCostPerUser = function () {
        var modifier = 1;
        if (isDiscounted) {
          modifier = 0.5;
        }
        return $scope.plan.costPerUser * modifier;
      };
    }
  };
}
