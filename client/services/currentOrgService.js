'use strict';

require('app')
  .factory('currentOrg', currentOrg);

function currentOrg(
  keypather
  ) {
  return {
    poppa: {},
    github: {},
    isPersonalAccount: isPersonalAccount
  };

  function isPersonalAccount () {
    return keypather.get(this, 'poppa.attrs.isPersonalAccount');
  }
}
