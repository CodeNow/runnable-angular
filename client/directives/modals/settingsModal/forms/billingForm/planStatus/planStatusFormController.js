'use strict';

require('app')
  .controller('PlanStatusFormController', PlanStatusFormController);

function PlanStatusFormController(
  $q,
  billingPlans,
  currentOrg,
  fetchInstancesByPod,
  fetchPlan,
  keypather,
  loading
) {
  var PSFC = this;

  PSFC.configurations = undefined;
  PSFC.plan = undefined;
  PSFC.discount = null;
  PSFC.plans = billingPlans;
  PSFC.currentOrg = currentOrg;

  loading('billingForm', true);
  $q.all([
    fetchPlan(),
    fetchInstancesByPod()
  ])
    .then(function (results) {
      var plan = results[0];
      var instances = results[1];
      PSFC.plan = plan.next;
      PSFC.configurations = instances.models.length;
      PSFC.discount = plan.discount;
    })
    .finally(function () {
      loading('billingForm', false);
    });

  /**
   * Calculate the plan amount
   * @param {String} planName ID of the plan we are working with
   * @returns {String} String to be displayed that shows our current plan
   */
  PSFC.calculatePlanAmount = function (planName) {
    var costPerUser = keypather.get(billingPlans[planName], 'costPerUser');
    if (PSFC.discount) {
      return costPerUser * 0.5;
    }
    return costPerUser;
  };
}
