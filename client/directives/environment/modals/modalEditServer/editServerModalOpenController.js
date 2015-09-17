'use strict';

require('app')
  .controller('EditServerModalOpenController', EditServerModalOpenController);

function EditServerModalOpenController(
  tab,
  instance,
  close,
  ModalService,
  errs
) {
  this.tab = tab;
  this.instance = instance;
  this.actions = {
    close: function () {
      ModalService.showModal({
        controller: 'ConfirmationModalController',
        controllerAs: 'CMC',
        templateUrl: 'confirmCloseEditServer'
      })
        .then(function (modal) {
          modal.close.then(function (confirmed) {
            if ( confirmed ) {
              close();
            }
          })
        })
        .catch(errs.handler);

    }
  };
}
