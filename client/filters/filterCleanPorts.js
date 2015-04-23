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
  return function (portsObject, join) {
    if (portsObject) {
      var keys = Object.keys(portsObject);
      var map = keys.map(function (port) {
        return port.split('/')[0];
      });
      return !join ? map : (map.length ? map.join(' ') : 'None');
    }
  };
}
