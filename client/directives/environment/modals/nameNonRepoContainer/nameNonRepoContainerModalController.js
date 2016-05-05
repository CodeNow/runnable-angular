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
  MC.name = name;

  MC.saving = false;
  MC.instanceNames = [];
  fetchInstancesByPod()
    .then(function (instanceByPod) {
      instanceByPod.forEach(function (instance) {
        MC.instanceNames.push(instance.attrs.name);
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
            enabled: true
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
        .then(function () {
          MC.saving = false;
        });
    },
    cancel: function () {
      close(false);
    }
  };
}
