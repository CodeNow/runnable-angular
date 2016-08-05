'use strict';

require('app')
  .controller('ChangePaymentFormController', ChangePaymentFormController);

function ChangePaymentFormController(
  stripe,
  loading
) {
  var CPFC = this;

  CPFC.card = {
    number: '4242424242424242',
    exp_month: 12,
    exp_year: 2032,
    cvc: '123',
    address_zip: '12312'
  };

  var messageConversion = {
    api_connection_error: 'We\'re having trouble connecting to our payment processor. Please try again.',
    api_error: 'Uh oh. Our payment processor is having trouble saving your card. Please try again.',
    authentication_error: 'Uh oh. We\'re having trouble saving your info. Please contact support.',
    invalid_request_error: 'Uh oh. We\'re having trouble saving your info. Please contact support.',
    rate_limit_error: 'We\'re currently being rate limited by our payment processor. Please try again'
  };

  CPFC.actions = {
    save: function () {
      loading.reset('savePayment');
      loading('savePayment', true);
      return stripe.card.createToken(CPFC.card)
        .then(function (res) {
          console.log('TODO: Send id to API', res.id);
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
