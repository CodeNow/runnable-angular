'use strict';

require('app').controller('ComposeCardController', ComposeCardController);

function ComposeCardController(
  $q,
  $rootScope,
  promisify,
  currentOrg,
  errs,
  keypather,
  ModalService
) {
  var CCC = this;

  CCC.activeAccount = currentOrg.github.attrs.login;

  CCC.getStagingInstances = function () {
    if (CCC.isChild) {
      return keypather.get(CCC.composeCluster.master, 'isolation.instances.models');
    }
    return CCC.composeCluster.staging;
  };

  CCC.getTestingInstances = function () {
    if (CCC.isChild) {
      if (CCC.composeCluster.master.attrs.isTesting) {
        return keypather.get(CCC.composeCluster.master, 'isolation.instances.models');
      }
      return keypather.get(CCC.composeCluster, 'testing[0].isolation.instances.models');
    }
    return CCC.composeCluster.testing;
  };

  CCC.deleteService = function () {
    $rootScope.$broadcast('close-popovers');
    return ModalService.showModal({
      controller: 'ConfirmationModalController',
      controllerAs: 'CMC',
      templateUrl: 'confirmDeleteServerView'
    })
      .then(function (modal) {
        return modal.close.then(function (confirmed) {
          if (confirmed) {
            var allInstances = [CCC.composeCluster.master];
            allInstances = allInstances.concat(CCC.composeCluster.staging);
            allInstances = allInstances.concat(CCC.composeCluster.testing);
            var deletePromises = allInstances.map(function (instance) {
              if (!instance) {
                return $q.when();
              }
              return promisify(instance, 'destroy')();
            });

            return $q.all(deletePromises);
          }
          return confirmed;
        });
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
        return modal.close.then(function (confirmed) {
          if (confirmed) {
            return promisify(CCC.composeCluster.master, 'destroy')();
          }
          return confirmed;
        });
      })
      .catch(errs.handler);
  };
}



