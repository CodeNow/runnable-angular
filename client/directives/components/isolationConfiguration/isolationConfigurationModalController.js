'use strict';

require('app').controller('IsolationConfigurationModalController', IsolationConfigurationModalController);

function IsolationConfigurationModalController(
  fetchInstancesByPod,
  loading,
  createIsolation,
  errs,
  promisify,
  $location,
  keypather,

  instance,
  close
) {
  var ICMC = this;
  ICMC.instance = instance;
  ICMC.close = close;
  loading.reset('createIsolation');

  ICMC.createIsolation = function () {

    var isolatedChildren = [];
    Object.keys(ICMC.instanceCheckboxes)
      .filter(function (instanceId) {
        return ICMC.instanceCheckboxes[instanceId];
      })
      .forEach(function (instanceId) {
        var repoInstance = ICMC.repoInstances.find(function (instance) {
          return instance.id() === instanceId;
        });
        if (repoInstance) {
          return isolatedChildren.push({
            branch: ICMC.instanceBranchMapping[repoInstance.attrs.contextVersion.context].getBranchName(),
            // FIXME: This should be changed to instance ID
            repo: repoInstance.getRepoName(),
            org: repoInstance.attrs.owner.username
          });
        }

        var nonRepoInstance = ICMC.nonRepoInstances.find(function (instance) {
          return instance.id() === instanceId;
        });

        if (nonRepoInstance) {
          return isolatedChildren.push({instance: nonRepoInstance.id()});
        }
      });
    loading('createIsolation', true);
    createIsolation(ICMC.instance, isolatedChildren)
      .then(function () {
        $location.path('/' + ICMC.instance.attrs.owner.username + '/' + ICMC.instance.attrs.name);
        ICMC.close();
      })
      .catch(errs.handler)
      .finally(function () {
        promisify(ICMC.instance, 'fetch')()
          .then(function () {
            return promisify(ICMC.instance.isolation.instances, 'fetch')();
          })
          .finally(function () {
            loading('createIsolation', false);
          });
      });
  };

  ICMC.instanceBranchMapping = {};
  ICMC.instanceCheckboxes = {};

  fetchInstancesByPod()
    .then(function (instances) {
      instances = instances.models.filter(function (instance) {
        return keypather.get(instance, 'attrs.contextVersion.context') !== keypather.get(ICMC, 'instance.attrs.contextVersion.context');
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


