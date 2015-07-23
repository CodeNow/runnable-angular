'use strict';

require('app')
  .factory('getInstanceMaster', getInstanceMaster);

function getInstanceMaster(
  fetchInstancesByPod
) {
  return function (instance) {
    if (instance.masterPod) {
      return instance;
    }

    return fetchInstancesByPod().then(function (instances) {
      return instances.filter(function (masterInstance) {
        return masterInstance.attrs.contextVersion.context === instance.attrs.contextVersion.context;
      });
    });
  };
}