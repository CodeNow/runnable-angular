'use strict';

require('app').controller('InstanceNavigationController', InstanceNavigationController);

function InstanceNavigationController(
  $rootScope,
  ModalService,
  errs,
  keypather,
  promisify,
  $timeout,
  $state
) {
  var INC = this;
  INC.shouldExpand = false;
  function processContainers() {
    if (!INC.instance.attrs.isolated ||
        !INC.instance.attrs.isIsolationGroupMaster ||
        keypather.get($state, 'params.instanceName.split(\'--\')[0]') !== INC.instance.attrs.shortHash &&
        $state.params.instanceName !== INC.instance.attrs.name) {
      INC.shouldExpand = false;
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

  INC.setupIsolation = function () {
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

  INC.configureContainer = function () {
    $rootScope.$broadcast('close-popovers');

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

  this.editInstance = function (event) {
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
}


