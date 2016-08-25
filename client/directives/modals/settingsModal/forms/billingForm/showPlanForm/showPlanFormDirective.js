'use strict';

require('app').directive('showPlanForm', showPlanForm);

function showPlanForm(
  fetchPlan,
  loading
) {
  return {
    restrict: 'A',
    templateUrl: 'showPlanForm',
    link: function ($scope) {
      loading('billingForm', true);
      fetchPlan()
        .then(function (plan) {
          $scope.discount = plan.discount;
        })
        .finally(function () {
          loading('billingForm', false);
        });
    }
  };
}
