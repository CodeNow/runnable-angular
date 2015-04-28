'use strict';

require('app')
  .filter('extractInstancePorts', extractInstancePorts);
/**
 * This filter returns a list of instances that have open ports
 * @returns {Function}
 */
function extractInstancePorts(keypather) {
  return function (instance) {
    var portsObj = keypather.get(instance, 'containers.models[0].attrs.ports');
    console.log(portsObj);
    if (!portsObj) {
      return [];
    }
    return Object.keys(portsObj).map(function (port){
      return port.split('/')[0];
    });
  };
}
