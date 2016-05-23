'use strict';

require('app')
  .controller('NameNonRepoContainerViewModalController', NameNonRepoContainerViewModalController);

function NameNonRepoContainerViewModalController(
  $rootScope,
  copySourceInstance,
  createAndBuildNewContainer,
  eventTracking,
  errs,
  fetchInstancesByPod,

  close,
  name,
  isolation,
  instanceToForkName,
  sourceInstance
) {
  var MC = this;
  angular.extend(MC, {
    name: name,
    instanceToForkName: instanceToForkName,
    saving: false,
    instanceNames: []
  });

  fetchInstancesByPod()
    .then(function (instanceByPod) {
      MC.instanceNames = instanceByPod.map(function (instance) {
        return instance.attrs.name;
      });
    });

  MC.actions = {
    save: function () {
      MC.saving = true;
      var serverModel = {
        opts: {
          name: MC.name,
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
          MC.name
        )
          .then(function (build) {
            serverModel.build = build;
            eventTracking.createdNonRepoContainer(instanceToForkName);
            return serverModel;
          }),
        MC.name,
        isolationConfig
      )
        .then(function () {
          close();
        })
        .catch(errs.handler)
        .finally(function () {
          MC.saving = false;
        });
    },
    cancel: close
  };
}
