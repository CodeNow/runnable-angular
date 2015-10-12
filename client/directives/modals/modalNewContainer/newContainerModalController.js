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
    ModalService.showModal({
      controller: 'SetupServerModalController',
      controllerAs: 'SMC',
      templateUrl: 'setupServerModalView',
      inputs: {
        data: $scope.data,
        actions: $scope.actions
      }
    });
  };
  NCMC.newTemplateContainer = function () {
    console.log('New Repo Template Container');
  };
}
