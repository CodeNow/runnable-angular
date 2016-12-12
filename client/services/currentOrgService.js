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
    // return keypather.get(org, 'poppa.attrs.isPersonalAccount');
    return true;
  };

  return org;
}
