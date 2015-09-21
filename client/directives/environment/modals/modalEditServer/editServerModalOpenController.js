'use strict';

require('app')
  .controller('EditServerModalOpenController', EditServerModalOpenController);

function EditServerModalOpenController(
  $scope,
  ModalService,
  errs,

  tab,
  instance,
  close
) {
  var ESMOC = this;
  this.tab = tab;
  this.instance = instance;
  this.closeHandler = angular.noop;

  $scope.$on('set-close-modal-handler', function (event, closeHandler) {
    ESMOC.closeHandler = closeHandler;
  });

  this.actions = {
    close: function () {
      var shouldConfirm = ESMOC.closeHandler();
      if (shouldConfirm) {
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
            });
          })
          .catch(errs.handler);
      } else {
        close();
      }
    }
  };
}
