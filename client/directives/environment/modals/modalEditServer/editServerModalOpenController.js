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
  ESMOC.tab = tab;
  ESMOC.instance = instance;
  ESMOC.closeHandler = angular.noop;

  $scope.$on('set-close-modal-handler', function (event, closeHandler) {
    ESMOC.closeHandler = closeHandler;
  });

  ESMOC.actions = {
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
