'use strict';

require('app')
  .filter('filterCleanPorts', filterCleanPorts);
/**
 * Ports are an
 *
 * "ports" : {
      "3306/tcp" : [
          {
            "HostIp" : "0.0.0.0",
            "HostPort" : "49257"
          }
      ]
 */
function filterCleanPorts() {
  return function (url) {
    return /:\d{1,5}/.test(url) ? url.substring(url.lastIndexOf(':') + 1) : '80';
  };
}
