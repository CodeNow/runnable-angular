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
    var isolatedChildren = [];
    Object.keys(ICMC.instanceBranchMapping).forEach((function (key) {
      isolatedChildren.push(ICMC.instanceBranchMapping[key]);
    }));

    isolatedChildren = isolatedChildren.map(function (instance) {
      return {
        branch: instance.getBranchName(),
        repo: instance.getRepoName(),
        org: instance.attrs.owner.username
      };
    });

    ICMC.nonRepoInstances.forEach(function (instance) {
      isolatedChildren.push(instance.id());
    });

    loading('createIsolation', true);
    createIsolation( ICMC.instance, isolatedChildren)
      .catch(errs.handler)
      .finally(function () {
        loading('createIsolation', false);
        close();
      });
  };

  ICMC.instanceBranchMapping = {};


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


