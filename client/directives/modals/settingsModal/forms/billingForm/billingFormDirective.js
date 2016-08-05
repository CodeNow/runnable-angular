'use strict';

require('app').directive('billingForm', billingForm);

function billingForm(
  fetchPaymentMethod,
  fetchPlan,
  fetchInvoices,
  loading,
  $q
) {
  return {
    restrict: 'A',
    templateUrl: 'billingForm',
    link: function ($scope, element) {
      loading.reset('billingForm');
      loading('billingForm', true);

      // Load all the data we need for the sub views.
      $q.all([
        fetchPaymentMethod(),
        fetchInvoices(),
        fetchPlan()
      ])
        .finally(function () {
          loading('billingForm', false);
        });
    }
  };
}
