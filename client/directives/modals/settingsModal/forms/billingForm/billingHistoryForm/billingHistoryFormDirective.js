'use strict';

require('app').directive('billingHistoryForm', billingHistoryForm);

function billingHistoryForm(
  fetchInvoices,
  moment,
  loading
) {
  return {
    restrict: 'A',
    templateUrl: 'billingHistoryForm',
    link: function ($scope, element) {
      $scope.invoices = [];
      loading('billingForm', true);
      fetchInvoices()
        .then(function (invoices) {
          $scope.invoices = invoices;
        })
        .finally(function () {
          loading('billingForm', false);
        });

      $scope.getBillingDate = function (invoice) {
        return moment(invoice.periodEnd).format('M/D/YYYY');
      };
    }
  };
}
