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
    if (!instance.attrs.isMaster) {
      name = name.replace(instance.getBranchName() + '-', '');
    }
    var clusterName = instance.attrs.inputClusterConfig.clusterName;
    return name.replace(clusterName + '-', '');
  };
}
