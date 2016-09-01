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
          $scope.invoices = invoices.filter(function (invoice) {
            return invoice.total > 0;
          });
        })
        .finally(function () {
          loading('billingForm', false);
        });

      $scope.getBillingDate = function (invoice) {
        return moment(invoice.periodEnd).format('MMM Do, YYYY');
      };
    }
  };
}
