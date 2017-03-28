'use strict';

require('app')
  .factory('getInstanceServiceName', getInstanceServiceName);

function getInstanceServiceName(
  keypather
) {
  return function (instance) {
    if (!instance || !keypather.get(instance, 'attrs.inputClusterConfig._id')) {
      return '';
    }
    var name = instance.attrs.name;
    if (name.indexOf('--') > 0) {
      name = name.split('--')[1];
    }
    if (!instance.attrs.isMaster) {
      name = name.replace(instance.getBranchName() + '-', '');
    }
    var clusterName = instance.attrs.inputClusterConfig.clusterName;
    return name.replace(clusterName + '-', '');
  };
}
