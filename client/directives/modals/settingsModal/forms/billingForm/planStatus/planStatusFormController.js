'use strict';

require('app')
  .controller('PlanStatusFormController', PlanStatusFormController);

function PlanStatusFormController(
  $q,
  $rootScope,
  billingPlans,
  fetchInstancesByPod,
  fetchPaymentMethod,
  fetchPlan,
  keypather,
  loading
) {
  var PSFC = this;

  PSFC.configurations = undefined;
  PSFC.plan = undefined;
  PSFC.discounted = false;
  PSFC.plans = billingPlans;
  PSFC.activeAccount = $rootScope.dataApp.data.activeAccount;

  if (PSFC.activeAccount.isInTrial()) {
    loading('billingForm', true);
    fetchPaymentMethod()
      .then(function (paymentMethod) {
        PSFC.paymentMethod = paymentMethod;
      })
      .finally(function () {
        loading('billingForm', false);
      });
  }

  loading('billingForm', true);
  $q.all([
    fetchPlan(),
    fetchInstancesByPod()
  ])
    .then(function (results) {
      var plan = results[0];
      var instances = results[1];
      PSFC.plan = plan.next.plan;
      PSFC.configurations = instances.models.length;
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
    if (PSFC.discounted) {
      return costPerUser * 0.5;
    }
    return costPerUser;
  };
}
