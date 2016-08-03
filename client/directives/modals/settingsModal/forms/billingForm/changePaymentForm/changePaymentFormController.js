'use strict';

require('app')
  .controller('ChangePaymentFormController', ChangePaymentFormController);

function ChangePaymentFormController(
  stripe,
  loading
) {
  var CPFC = this;
  this.updating = this.updating === 'true'; //Coerce the value to a boolean

  CPFC.card = {
    number: "6492085184484882",
    exp_month: 12,
    exp_year: 2032,
    cvc: '123',
    zip: '12312'
  };

  var messageConversion = {
    api_connection_error: 'Unable to communicate with payment provider. Please try again later.',
    api_error: 'There was an issue when trying to save your card. Please try again later.',
    authentication_error: 'Ooops, there was an issue trying to save your information. We are on the case. Please try again later.',
    invalid_request_error: 'There was an issue trying to save your information. We are on the case. Please try again later.',
    rate_limit_error: 'We are currently being rate limited, please try again later.'
  };

  CPFC.actions = {
    save: function () {
      loading.reset('savePayment');
      loading('savePayment', true);
      return stripe.card.createToken(CPFC.card)
        .then(function (res) {
          console.log(res);
          CPFC.save();
        })
        .catch(function (err) {
          if (err.type === 'card_error') {
            CPFC.error = err.message;
          } else {
            CPFC.error = messageConversion[err.type];
          }
        })
        .finally(function () {
          loading('savePayment', false);
        });
    },
    back: function () {
      CPFC.back();
    },
    cancel: function () {
      CPFC.cancel();
    }
  };
}
