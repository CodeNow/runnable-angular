'use strict';

require('app').controller('InstanceNavigationController', InstanceNavigationController);

function InstanceNavigationController(
  $rootScope,
  ModalService
) {
  var INC = this;

  console.log('Running InstanceNavigationController!');

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
}


