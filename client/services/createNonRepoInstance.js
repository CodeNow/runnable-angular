'use strict';

require('app')
  .factory('createNonRepoInstance', createNonRepoInstance);

function createNonRepoInstance(
  $rootScope,
  createAndBuildNewContainer,
  copySourceInstance,
  eventTracking,
  keypather
) {
  return function (instanceName, sourceInstance, isolation, instanceToForkName) {
    instanceToForkName = instanceToForkName || keypather.get(sourceInstance, 'attrs.name');
    var serverModel = {
      opts: {
        name: instanceName,
        masterPod: true,
        ipWhitelist: {
          enabled: false
        }
      }
    };
    var isolationConfig;
    if (isolation) {
      isolationConfig = {
        isolation: isolation
      };
    }
    return createAndBuildNewContainer(
      copySourceInstance(
        $rootScope.dataApp.data.activeAccount,
        sourceInstance,
        instanceName
      )
        .then(function (build) {
          serverModel.build = build;
          eventTracking.createdNonRepoContainer(instanceToForkName);
          return serverModel;
        }),
      instanceName,
      isolationConfig
    );
  };
}
