'use strict';

require('app').controller('InstanceNavigationController', InstanceNavigationController);

function InstanceNavigationController(
  $location,
  $rootScope,
  $state,
  $timeout,
  createIsolation,
  currentOrg,
  demoFlowService,
  errs,
  fetchInstancesByPod,
  keypather,
  ModalService,
  getPathShortHash,
  promisify
) {
  var INC = this;
  INC.currentOrg = currentOrg;
  INC.isInDemoFlow = demoFlowService.isInDemoFlow;
  INC.shouldExpand = false;
  function processContainers() {
    var instance = INC.instance;
    if (!instance ||
        !instance.attrs.isolated ||
        !instance.attrs.isIsolationGroupMaster ||
      getPathShortHash() !== INC.instance.attrs.shortHash &&
        $state.params.instanceName !== INC.instance.attrs.name) {
      INC.shouldExpand = $state.params.instanceName === keypather.get(INC, 'instance.attrs.name') && keypather.get(INC, 'instance.attrs.isIsolationGroupMaster') !== false;
      return;
    }
    if (!keypather.get(INC, 'instance.isolation.instances')) {
      // The API client's `parse` method is an async operation, and we need that to be called before the
      // instances will exist on isolation. Keep looping until that parse is finished.
      $timeout(processContainers, 10);
      return;
    }
    INC.shouldExpand = true;
    var hasContainers = keypather.get(INC, 'instance.isolation.instances.models.length') > 0;
    if (!hasContainers) {
      promisify(INC.instance.isolation.instances, 'fetch')()
        .catch(errs.handler);
    }
  }

  $rootScope.$on('$stateChangeSuccess', function () {
    processContainers();
  });
  processContainers();

  INC.shouldShowSetupModal = null;

  fetchInstancesByPod()
    .then(function (instances) {
      INC.shouldShowSetupModal = instances.models.length > 1;
    });

  INC.setupIsolation = function () {
    $rootScope.$broadcast('close-popovers');

    if (INC.shouldShowSetupModal) {
      ModalService.showModal({
        controller: 'IsolationConfigurationModalController',
        controllerAs: 'ICMC',
        templateUrl: 'isolationConfigurationModalView',
        inputs: {
          instance: INC.instance
        }
      });
    } else {
      createIsolation(INC.instance, [])
        .then(function () {
          $location.path('/' + INC.instance.attrs.owner.username + '/' + INC.instance.attrs.name);
          promisify(INC.instance, 'fetch')()
            .then(function () {
              promisify(INC.instance.isolation.instances, 'fetch')();
            });
        })
        .catch(errs.handler);
    }
  };

  INC.disableIsolation = function () {
    $rootScope.$broadcast('close-popovers');

    ModalService.showModal({
      controller: 'ConfirmationModalController',
      controllerAs: 'CMC',
      templateUrl: 'disableIsolationConfirmationModal'
    })
      .then(function (modal) {
        modal.close.then(function (confirmed) {
          if (confirmed) {
            promisify(INC.instance.isolation, 'destroy')()
              .then(function () {
                INC.instance.fetch();
              })
              .catch(errs.handler);
          }
        });
      })
      .catch(errs.handler);
  };

  INC.addContainerToIsolation = function () {
    $rootScope.$broadcast('close-popovers');
    ModalService.showModal({
      controller: 'SetupTemplateModalController',
      controllerAs: 'STMC',
      templateUrl: 'setupTemplateModalView',
      inputs: {
        isolation: INC.instance.isolation
      }
    });
  };

  INC.deleteContainer = function () {
    $rootScope.$broadcast('close-popovers');
    ModalService.showModal({
      controller: 'ConfirmationModalController',
      controllerAs: 'CMC',
      templateUrl: 'confirmDeleteServerView'
    })
      .then(function (modal) {
        modal.close.then(function (confirmed) {
          if (confirmed) {
            promisify(INC.instance, 'destroy')()
              .catch(errs.handler);
          }
        });
      })
      .catch(errs.handler);
  };

  INC.removeBranch = function () {
    $rootScope.$broadcast('close-popovers');
    ModalService.showModal({
      controller: 'ConfirmationModalController',
      controllerAs: 'CMC',
      templateUrl: 'confirmBranchRemoveView'
    })
      .then(function (modal) {
        modal.close.then(function (confirmed) {
          if (confirmed) {
            promisify(INC.instance, 'destroy')();
          }
        });
      })
      .catch(errs.handler);
  };

  INC.editInstance = function (event) {
    $rootScope.$broadcast('close-popovers');
    event.stopPropagation();
    event.preventDefault();
    ModalService.showModal({
      controller: 'EditServerModalController',
      controllerAs: 'SMC',
      templateUrl: 'editServerModalView',
      inputs: {
        tab: keypather.get(INC.instance, 'contextVersion.attrs.advanced') ? 'env' : 'repository',
        instance: INC.instance,
        actions: {}
      }
    })
      .catch(errs.handler);
  };

  INC.setupAutoIsolation = function () {
    $rootScope.$broadcast('close-popovers');
    ModalService.showModal({
      controller: 'IsolationConfigurationModalController',
      controllerAs: 'ICMC',
      templateUrl: 'isolationConfigurationModalView',
      inputs: {
        instance: INC.instance
      }
    });
  };
}
