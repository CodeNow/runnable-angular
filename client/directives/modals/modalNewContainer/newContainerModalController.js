'use strict';

require('app')
  .controller('NewContainerModalController', NewContainerModalController);

function NewContainerModalController(
  ModalService,
  keypather,
  helpCards,
  close
) {
  var NCMC = this;
  var helpCard = helpCards.getActiveCard();
  NCMC.servicesActive = keypather.get(helpCard, 'id') === 'missingDependency';
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
      templateUrl: 'setupTemplateModalView',
      inputs: {
        isolation: null
      }
    });
  };
}
