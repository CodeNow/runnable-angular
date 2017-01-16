'use strict';

require('app')
  .factory('defaultContainerUrl', defaultContainerUrl);

function defaultContainerUrl(
  extractInstancePorts
) {
  return function (instance, forceHttps) {
    var defaultPort = '';
    var ports = extractInstancePorts(instance);
    var preamble = forceHttps ? 'https://' : 'http://';
    if (ports.length) {
      if (!ports.includes('80')) {
        if (ports.includes('443')) {
          preamble = 'https://';
        } else {
          defaultPort = ':' + ports[0];
        }
      }
    }

    return preamble + instance.getContainerHostname() + defaultPort;
  };
}
