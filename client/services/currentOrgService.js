'use strict';

require('app')
  .factory('currentOrg', currentOrg);

function currentOrg() {
  return {
    poppa: {},
    github: {}
  };
}
