'use strict';

require('app').controller('IsolationConfigurationModalController', IsolationConfigurationModalController);

function IsolationConfigurationModalController(
  fetchInstancesByPod,
  loading,
  createIsolation,
  errs,

  instance,
  close
) {
  var ICMC = this;
  ICMC.instance = instance;
  ICMC.close = close;
  loading.reset('createIsolation');

  ICMC.createIsolation = function () {

    var isolatedChildren = []
    Object.keys(ICMC.instanceCheckboxes).forEach(function (instanceId) {
      var repoInstance = ICMC.repoInstances.find(function (instance) {
        return instance.id() === instanceId;
      });
      if (repoInstance) {
        return isolatedChildren.push({
          branch: repoInstance.getBranchName(),
          repo: repoInstance.getRepoName(),
          org: repoInstance.attrs.owner.username
        });
      }

      var nonRepoInstance = ICMC.nonRepoInstances.find(function (instance) {
        return instance.id() === instanceId;
      });

      if (nonRepoInstance) {
        return isolatedChildren.push({instanceId: instance.id()});
      }
    });

    loading('createIsolation', true);
    createIsolation(ICMC.instance, isolatedChildren)
      .then(function () {
        ICMC.close();
      })
      .catch(errs.handler)
      .finally(function () {
        ICMC.instance.fetch();
        loading('createIsolation', false);
      });
  };

  ICMC.instanceBranchMapping = {};
  ICMC.instanceCheckboxes = {};

  fetchInstancesByPod()
    .then(function (instances) {
      instances = instances.models.filter(function (instance) {
        return instance.attrs.contextVersion.context !== ICMC.instance.attrs.contextVersion.context;
      });

      ICMC.repoInstances = instances
        .filter(function (instance) {
          return instance.getRepoName();
        });

      ICMC.repoInstances.forEach(function (instance) {
        ICMC.instanceBranchMapping[instance.attrs.contextVersion.context] = instance;
      });

      ICMC.nonRepoInstances = instances.filter(function (instance) {
        return !instance.getRepoName();
      });
    });
}


