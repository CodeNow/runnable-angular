'use strict';

require('app')
  .factory('savePaymentMethod', savePaymentMethod);

function savePaymentMethod(
  $http,
  $q,
  configAPIHost,
  currentOrg,
  keypather
) {

  var coerce400ResponseError = function (resData) {
    var message = keypather.get(resData, 'message');
    if (message && message.match(/StripeCardError/)) {
      var errorMessageParts = message.match(/(StripeCardError)(\:\W)(.*)/);
      var newErrorMessage = keypather.get(errorMessageParts, '[3]') || 'Unknown card error';
      var newError = new Error(newErrorMessage);
      newError.type = 'card_error';
      return $q.reject(newError);
    }
    return $q.reject(new Error(keypather.get(resData, 'error')));
  };

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
        /**
         * Never catch these errors in this service since we use these errors
         * in other controllers to catch Stripe errors
         */
        return coerce400ResponseError(res.data);
      });
  };
}
