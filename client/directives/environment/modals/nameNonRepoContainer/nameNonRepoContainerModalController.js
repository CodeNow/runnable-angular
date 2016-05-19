'use strict';

require('app')
  .controller('NameNonRepoContainerViewModalController', NameNonRepoContainerViewModalController);

function NameNonRepoContainerViewModalController(
  createNonRepoInstance,
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
      return createNonRepoInstance(MC.name, sourceInstance, isolation, instanceToForkName)
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
