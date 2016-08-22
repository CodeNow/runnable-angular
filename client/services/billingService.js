'use strict';

require('app')
  .factory('savePaymentMethod', savePaymentMethod);

function savePaymentMethod(
  $http,
  configAPIHost,
  currentOrg
) {
  return function (stripeToken) {
    return $http({
      method: 'post',
      url: configAPIHost + '/billing/payment-method',
      params: {
        organizationId: currentOrg.poppa.id()
      },
      data: {
        stripeToken: stripeToken
      }
    })
      .then(function (res) {
        return res.data;
      });
  };
}
