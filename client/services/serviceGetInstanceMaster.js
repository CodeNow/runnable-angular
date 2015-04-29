'use strict';

require('app')
  .factory('getInstanceMaster', getInstanceMaster);

function getInstanceMaster(
  fetchInstances
) {
  return function (instance) {
    if (instance.masterPod) {
      return instance;
    }

    return fetchInstances({
      'contextVersion.context': instance.attrs.contextVersion.context,
      masterPod: true
    }).then(function (instances) {
      return instances.models[0];
    });
  };
}