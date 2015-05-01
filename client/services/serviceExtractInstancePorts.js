'use strict';

require('app')
  .factory('extractInstancePorts', extractInstancePorts);

function extractInstancePorts(keypather) {
  return function (instance) {
    var portsObj = keypather.get(instance, 'containers.models[0].attrs.ports');
    if (!portsObj) {
      return [];
    }
    return Object.keys(portsObj).map(function (port){
      return port.split('/')[0];
    });
  };
}
