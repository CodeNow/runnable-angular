'use strict';

require('app')
  .controller('ChangePaymentFormController', ChangePaymentFormController);

function ChangePaymentFormController(
  $rootScope,
  currentOrg,
  fetchPaymentMethod,
  loading,
  savePaymentMethod,
  stripe,
  fetchPlan
) {
  var CPFC = this;
  CPFC.currentOrg = currentOrg;

  CPFC.card = {
    number: undefined,
    exp_month: undefined,
    exp_year: undefined,
    cvc: undefined,
    address_zip: undefined
  };

  fetchPlan()
    .then(function (plan) {
      CPFC.plan = plan;
    });

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
          return savePaymentMethod(res.id);
        })
        .then(function () {
          // Not doing an angular timeout because we don't care about the digest.
          // We want to wait for this form to no longer be visible before we clear it and cause error outlines to show.
          setTimeout(function () {
            CPFC.card = {};
          }, 1000);
          fetchPaymentMethod.cache.clear();
          CPFC.save();
          $rootScope.$broadcast('updated-payment-method');
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
