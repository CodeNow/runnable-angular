'use strict';

require('app').directive('planStatusForm', planStatusForm);

function planStatusForm(
  billingPlans,
  keypather,
  fetchInstancesByPod,
  fetchPlan
) {
  return {
    restrict: 'A',
    templateUrl: 'planStatusForm',
    link: function ($scope, element) {
      $scope.state = {
        configurations: undefined,
        plan: undefined,
        discounted: true
      };
      $scope.plans = billingPlans;

      // Populate current plan
      fetchPlan()
        .then(function (plan) {
          $scope.state.plan = plan.next.plan;
        });

      // Populate number of configurations
      fetchInstancesByPod()
        .then(function (instances) {
          $scope.state.configurations = instances.models.length;
        });

      /**
       * Get the classes for the meter
       * @returns {Object} - Object with keys of class names and true/false for if they should be enabled
       */
      $scope.getMeterClass = function () {
        var classes = {};
        if ($scope.state.configurations) {
          classes['used-' + $scope.state.configurations] = true;
        }
        if (keypather.get($scope, 'state.preview.length')) {
          classes['preview-used-' + billingPlans[$scope.state.preview].maxConfigurations] = true;
        }
        return classes;
      };

      /**
       * Calculate the plan amount
       * @param {String} planName ID of the plan we are working with
       * @returns {String} String to be displayed that shows our current plan
       */
      $scope.calculatePlanAmount = function (planName) {
        var costPerUser = billingPlans[planName].costPerUser;
        if ($scope.state.discounted) {
          return (costPerUser * 0.5).toFixed(2);
        }
        return costPerUser;
      };
    }
  };
}
