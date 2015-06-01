'use strict';

require('app')
  .factory('findLinkedServerVariables', findLinkedServerVariables);


function findLinkedServerVariables($state, configUserContentDomain) {
  return function (input) {
    if (typeof input === 'string') {
      input = input.split('\n');
    } else if (!Array.isArray(input)) {
      return {};
    }

    var domain = ($state.params.userName + '.' + configUserContentDomain).toLowerCase();
    var servers = [];
    input.forEach(function (line, index) {
      if (line.toLowerCase().indexOf(domain) > -1) {
        servers.push(line.replace(/.*?=/, ''));
      }
    });

    return servers;
  };
}
