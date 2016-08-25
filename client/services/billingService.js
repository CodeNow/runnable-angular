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

  var coerce400ResponseError = function (resData) {
    var message = keypather.get(resData, 'message');
    if (message && message.match(/StripeCardError/)) {
      var errorMessageParts = message.match(/(StripeCardError)(\:\W)(.*)/);
      var newErrorMessage = errorMessageParts[3] || 'Unknown card error';
      var newError = new Error(newErrorMessage);
      newError.type = 'card_error';
      throw newError;
    }
    return errs.handler(new Error(keypather.get(resData, 'error')));
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
      /**
       * Catch any errors related to HTTP request, allow certain validation
       * errors to be thrown
       */
      .catch(errs.handler)
      .then(function (res) {
        if (res.status < 300) {
          return res.data;
        }
        return coerce400ResponseError(res.data);
      });
  };
}
