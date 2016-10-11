'use strict';

require('app')
  .factory('defaultContainerUrl', defaultContainerUrl);

function defaultContainerUrl(
  extractInstancePorts
) {
  return function (instance) {
    var defaultPort = '';
    var ports = extractInstancePorts(instance);
    if (ports.length) {
      if (!ports.includes('80')) {
        defaultPort = ':' + ports[0];
      }
    }
    var preamble = 'http://';
    if (defaultPort === ':443') {
      defaultPort = '';
      preamble = 'https://';
    }

    return preamble + instance.getContainerHostname() + defaultPort;
  };
}
