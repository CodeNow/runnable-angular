'use strict';

require('app').controller('ComposeCardController', ComposeCardController);

function ComposeCardController(
  $q,
  $rootScope,
  $scope,
  currentOrg,
  errs,
  composeCardActive,
  keypather,
  ModalService,
  getNavigationName,
  promisify
) {
  var CCC = this;

  function fetchIsolationIfNotFetched (instance) {
    var hasContainers = keypather.get(instance, 'isolation.instances.models.length') > 0;
    if (!hasContainers) {
      if (!instance.isolation.instances) {
        // For some reason we haven't populated the isolation's instances param yet, let's just force it.
        // For the record, I dislike this a TON, but it's the best way of getting this done easily.
        instance.isolation.parse(instance.isolation.attrs);
      }
      promisify(instance.isolation.instances, 'fetch')()
        .catch(errs.handler);
    }
  }

  CCC.checkIfActive = function () {
    if (!CCC.isChild) {
      $scope.isActive = true;
      return;
    }
    $scope.isActive = composeCardActive(CCC.composeCluster);
    if ($scope.isActive) {
      fetchIsolationIfNotFetched(CCC.composeCluster.master);
      (CCC.composeCluster.testing || []).forEach(fetchIsolationIfNotFetched);
      (CCC.composeCluster.staging || []).forEach(fetchIsolationIfNotFetched);
    }
  };

  CCC.activeAccount = currentOrg.github.attrs.login;

  function sortInstancesByNavName (a, b) {
    var nameA = getNavigationName(a);
    var nameB = getNavigationName(b);
    if (nameA > nameB) {
      return -1;
    }
    if (nameA < nameB) {
      return 1;
    }
    return 0;
  }

  CCC.getStagingInstances = function () {
    var instanceList;
    if (CCC.isChild) {
      instanceList = keypather.get(CCC.composeCluster.master, 'isolation.instances.models');
    } else {
      instanceList = CCC.composeCluster.staging;
    }
    return (instanceList || []).sort(sortInstancesByNavName);
  };

  // CCC.getStagingInstances = function () {
  //   var instanceList;
  //   var clusterList;
  //   if (CCC.isChild) {
  //     instanceList = keypather.get(CCC.composeCluster.master, 'isolation.instances.models');
  //   } else {
  //     clusterList = CCC.composeCluster.staging;
  //   }
  //   if (instanceList) {
  //     return (instanceList || []).sort(sortInstancesByNavName);
  //   }
  //   if (clusterList) {
  //     var clusterNames = Object.keys(clusterList)
  //     var sortedClusterList = clusterNames.reduce(function (clusters, clusterName) {
  //       clusters[clusterName] = (clusterList[clusterName] || []).sort(sortInstancesByNavName);
  //       return clusters;
  //     }, []);
  //     return clusterNames.map(function (clusterName) {
  //       return sortedClusterList[clusterName];
  //     })
  //   }
  //   return [];
  // };

  CCC.getTestingInstances = function () {
    if (CCC.isChild) {
      if (CCC.composeCluster.master.attrs.isTesting) {
        return (keypather.get(CCC.composeCluster.master, 'isolation.instances.models') || []).sort(sortInstancesByNavName);
      }
      return [CCC.composeCluster.testing[0]].concat(keypather.get(CCC.composeCluster, 'testing[0].isolation.instances.models').sort(sortInstancesByNavName));
    }
    return (CCC.composeCluster.testing || []).sort(sortInstancesByNavName);
  };

  function deleteCluster (cluster) {
    var deletePromises = [cluster.master].concat(cluster.staging || [], cluster.testing || [])
      .map(function (instance) {
        return promisify(instance, 'destroy')();
      });
    return $q.all(deletePromises);
  }

  CCC.deleteService = function () {
    $rootScope.$broadcast('close-popovers');
    return ModalService.showModal({
      controller: 'ConfirmationModalController',
      controllerAs: 'CMC',
      templateUrl: 'confirmDeleteServerView'
    })
      .then(function (modal) {
        return modal.close;
      })
      .then(function (confirmed) {
        if (confirmed) {
          deleteCluster(CCC.composeCluster);
        }
        return confirmed;
      })
      .catch(errs.handler);
  };

  CCC.deleteBranch = function () {
    $rootScope.$broadcast('close-popovers');
    return ModalService.showModal({
      controller: 'ConfirmationModalController',
      controllerAs: 'CMC',
      templateUrl: 'confirmBranchRemoveView'
    })
      .then(function (modal) {
        return modal.close;
      })
      .then(function (confirmed) {
        if (confirmed) {
          return deleteCluster(CCC.composeCluster);
        }
        return confirmed;
      })
      .catch(errs.handler);
  };
}
