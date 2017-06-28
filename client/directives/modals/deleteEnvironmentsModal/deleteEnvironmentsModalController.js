'use strict';

require('app')
  .controller('DeleteEnvironmentsModalController', DeleteEnvironmentsModalController);

function DeleteEnvironmentsModalController(
  $q,
  $timeout,
  autoIsolationConfigId,
  close,
  deleteMultiCluster,
  fetchInstancesByCompose,
  fetchMultiClusterRelations,
  loading
) {
  var DEMC = this;
  DEMC.actions = {
    cancel: function () {
      close(false);
    },
    confirm: function () {
      loading('deleteMultiCluster', true);
      $timeout(function () {
        loading('deleteMultiCluster', false);
      }, 5000);
      // deleteMultiCluster(autoIsolationConfigId)
      //   .then(function () {
      //     close(true);
      //   })
      //   .finally(function () {
      //     loading('deleteMultiCluster', false);
      //   });
    }
  };
  loading('deleteEnvironmentRelations', true);
  $q.all([
    fetchInstancesByCompose(),
    fetchMultiClusterRelations(autoIsolationConfigId)
  ])
    .then(function (results) {
      var instancesByCompose = results[0];
      var relations = results[1];
      DEMC.relations = relations.clusters.map(function (cluster) {
        return cluster.repo.split('/')[1];
      });
      DEMC.affectedEnvironments = [];
      relations.clusters.forEach(function (cluster) {
        var AIC = cluster.autoIsolationConfigId;
        var instanceGroup = instancesByCompose.find(function (compose) {
          return compose.master.attrs.inputClusterConfig.autoIsolationConfigId === AIC;
        });
        DEMC.affectedEnvironments.push(instanceGroup.master);
        instanceGroup.children.forEach(function (childGroup) {
          DEMC.affectedEnvironments.push(childGroup.master);
        });
      });
    })
    .finally(function () {
      loading('deleteEnvironmentRelations', false);
    });
}
