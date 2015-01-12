'use strict';

require('app')
  .filter('instancesWithOpenPorts', instancesWithOpenPorts);
/**
 * This filter returns a list of instances that have open ports
 * @returns {Function}
 */
function instancesWithOpenPorts() {
  return function (instanceList, selectedInstance) {
    if (!instanceList || !instanceList.filter) {
      return [];
    }
    return instanceList.filter(function (instance) {
      return instance !== selectedInstance && instance.containers &&
        instance.containers.models.length &&
        typeof instance.containers.models[0].attrs.ports === 'object' &&
        !!Object.keys(instance.containers.models[0].attrs.ports).length;
    });
  };
}
