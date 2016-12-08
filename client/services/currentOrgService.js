'use strict';

require('app')
  .factory('currentOrg', currentOrg);

function currentOrg() {
  var org = {
    poppa: {},
    github: {}
  };

  org.isPersonalAccount = function () {
    return org.poppa.attrs.isPersonalAccount;
  };

  return org;
}
