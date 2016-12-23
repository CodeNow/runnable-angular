'use strict';

require('app')
  .controller('ChangePaymentFormController', ChangePaymentFormController);

function ChangePaymentFormController(
  $interval,
  $rootScope,
  $state,
  currentOrg,
  errs,
  fetchPaymentMethod,
  fetchPlan,
  fetchWhitelists,
  keypather,
  loading,
  savePaymentMethod,
  stripe
) {
  var CPFC = this;
  CPFC.currentOrg = currentOrg;
  CPFC.isCurrentOrgAllowed = currentOrg.poppa.attrs.allowed;

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
    api_connection_error: 'We’re having trouble connecting to our payment processor. Please try again.',
    api_error: 'Uh oh. Our payment processor is having trouble saving your card. Please try again.',
    authentication_error: 'Uh oh. We’re having trouble saving your info. Please contact support.',
    invalid_request_error: 'Uh oh. We’re having trouble saving your info. Please contact support.',
    rate_limit_error: 'We’re currently being rate limited by our payment processor. Please try again'
  };

  function handleActiveOrg () {
    loading('savePayment', false);
    CPFC.save();
    setTimeout(function () {
      CPFC.card = {};
    }, 1000);
    $rootScope.$broadcast('updated-payment-method');
  }

  function pollForAllowedOrg () {
    var timesToPoll = 20;
    var activeOrg = currentOrg.poppa.attrs.lowerName;
    CPFC.stopPollingForAllowedOrg = $interval(function (timesToPoll) {
      if (timesToPoll === 19 && !CPFC.isCurrentOrgAllowed) {
        $interval.cancel(CPFC.stopPollingForAllowedOrg);
        loading('savePayment', false);
        return $state.go('paused');
      }
      return fetchWhitelists()
        .then(function (whiteListedOrgs) {
          var updatedOrg = whiteListedOrgs.filter(function (org) {
            return org.attrs.lowerName === activeOrg;
          });
          if (keypather.get(updatedOrg[0], 'attrs.allowed')) {
            CPFC.isCurrentOrgAllowed = true;
            $interval.cancel(CPFC.stopPollingForAllowedOrg);
            handleActiveOrg();
          }
        });
    }, 3000, timesToPoll);
  }

  CPFC.actions = {
    save: function () {
      loading.reset('savePayment');
      loading('savePayment', true);
      return stripe.card.createToken(CPFC.card)
        .then(function (res) {
          return savePaymentMethod(res.id);
        })
        .then(function () {
          return fetchWhitelists();
        })
        .then(function () {
          fetchPaymentMethod.cache.clear();
          if (!CPFC.isCurrentOrgAllowed) {
            return pollForAllowedOrg();
          }
          handleActiveOrg();
        })
        .catch(function (err) {
          loading('savePayment', false);
          if (err.type === 'card_error') {
            CPFC.error = err.message;
          } else {
            CPFC.error = messageConversion[err.type];
          }
          if (!CPFC.error) {
            errs.handler(err);
          }
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
