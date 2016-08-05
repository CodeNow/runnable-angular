'use strict';

require('app').directive('planSummary', planSummary);

function planSummary(
  fetchPlan,
  billingPlans
) {
  return {
    restrict: 'A',
    templateUrl: 'planSummaryView',
    link: function ($scope, element) {
      fetchPlan()
        .then(function (plan) {
          $scope.plan = billingPlans[plan.next.plan.id];
        });
    }
  };
}
