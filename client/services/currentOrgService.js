'use strict';

require('app')
  .factory('currentOrg', currentOrg);

function currentOrg(
  featureFlags,
  keypather
) {
  var org = {
    poppa: {},
    github: {}
  };

  org.getDisplayName = function () {
    return keypather.get(org, 'github.oauthName()');
  };

  org.isPersonalAccount = function () {
    return featureFlags.flags.isPersonalAccount || keypather.get(org, 'poppa.attrs.isPersonalAccount');
  };

  org.willAcceptPayment = function () {
    return !keypather.get(org, 'poppa.attrs.isPermanentlyBanned') &&
           (keypather.get(org, 'poppa.isInGrace()') ||
            keypather.get(org, 'poppa.isGraceExpired()'));
  };

  org.isPaymentDue = function () {
    return (!org.poppa.attrs.allowed || org.poppa.isInGrace()) && org.willAcceptPayment();
  };

  org.isPaused = function () {
    return org.poppa.attrs.isPermanentlyBanned || !org.poppa.attrs.isActive;
  };

  org.isBillingVisible = function () {
    // Hide when onPrem or when FF is on
    return !(keypather.get(org, 'poppa.attrs.isOnPrem') || featureFlags.flags.hideBilling);
  };

  return org;
}
