'use strict';

require('app')
  .factory('savePaymentMethod', savePaymentMethod);

function savePaymentMethod(
  $http,
  configAPIHost,
  currentOrg,
  errs,
  keypather
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
        if (res.status < 300) {
          return res.data;
        }
        throw new Error(keypather.get(res, 'data.error'));
      })
      .catch(errs.handler);
  };
}
