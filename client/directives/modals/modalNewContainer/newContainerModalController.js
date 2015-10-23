'use strict';

require('app')
  .controller('NewContainerModalController', NewContainerModalController);

function NewContainerModalController(
  ModalService,
  close
) {
  var NCMC = this;
  NCMC.close = close;
  NCMC.newRepositoryContainer = function () {
    close();
    ModalService.showModal({
      controller: 'SetupServerModalController',
      controllerAs: 'SMC',
      templateUrl: 'setupServerModalView'
    });
  };
  NCMC.newTemplateContainer = function () {
    close();
    ModalService.showModal({
      controller: 'SetupTemplateModalController',
      controllerAs: 'STMC',
      templateUrl: 'setupTemplateModalView'
    });
  };
}
