'use strict';

require('app').directive('billingHistoryForm', billingHistoryForm);

function billingHistoryForm(
  fetchInvoices,
  moment
) {
  return {
    restrict: 'A',
    templateUrl: 'billingHistoryForm',
    link: function ($scope, element) {
      fetchInvoices()
        .then(function (invoices) {
          $scope.invoices = invoices;
        });

      $scope.getBillingDate = function (invoice) {
        return moment(invoice.period_end * 1000).format('M/D/YYYY');
      };
    }
  };
}
