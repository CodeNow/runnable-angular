'use strict';

require('app')
  .factory('currentOrg', currentOrg);

function currentOrg(
  keypather
) {
  var org = {
    poppa: {},
    github: {}
  };

  org.isPersonalAccount = function () {
    return keypather.get(org, 'poppa.attrs.isPersonalAccount');
  };

  org.canAccessUI = function () {
    return keypather.get(org, 'poppa.isInTrial()') || keypather.get(org, 'poppa.isInActivePeriod()');
  };

  org.willAcceptPayment = function () {
    return !keypather.get(org, 'poppa.attrs.isPermanentlyBanned') &&
           (keypather.get(org, 'poppa.isInGrace()') ||
            keypather.get(org, 'poppa.isGraceExpired()'));
  };

  return org;
}
