'use strict';

require('app')
  .controller('DeleteEnvironmentsModalController', DeleteEnvironmentsModalController);

function DeleteEnvironmentsModalController(
  $q,
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
      deleteMultiCluster(autoIsolationConfigId)
        .then(function () {
          close(true);
        })
        .finally(function () {
          loading('deleteMultiCluster', false);
        });
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
      DEMC.affectedEnvironments = [];
      var allClustersByCompose = [].concat(instancesByCompose[0], instancesByCompose[1]);
      allClustersByCompose = allClustersByCompose.reduce(function (allClusters, compose) {
        compose.clusters.reduce(function (allClusters, cluster) {
          allClusters.push(cluster);
          return allClusters;
        }, allClusters);
        return allClusters;
      }, []);
      DEMC.relations = relations.clusters;
      relations.clusters.forEach(function (cluster) {
        var AIC = cluster.autoIsolationConfigId;
        var instanceGroup = allClustersByCompose.find(function (compose) {
          return compose.master && compose.master.attrs.inputClusterConfig.autoIsolationConfigId === AIC;
        });
        if (instanceGroup && instanceGroup.master) {
          cluster.masterInstanceRepo = instanceGroup.master.getRepoName();
        }
        if (instanceGroup && instanceGroup.children) {
          DEMC.affectedEnvironments.push(instanceGroup.master);
          instanceGroup.children.forEach(function (childGroup) {
            DEMC.affectedEnvironments.push(childGroup.master);
          });
        }
      });
    })
    .finally(function () {
      loading('deleteEnvironmentRelations', false);
    });
}
