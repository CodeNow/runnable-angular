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
    link: function ($scope, element) {
      loading('billingForm', true);
      fetchPlan()
        .then(function (plan) {
          $scope.plan = billingPlans[plan.next.id];
        })
        .finally(function () {
          loading('billingForm', false);
        });
    }
  };
}
