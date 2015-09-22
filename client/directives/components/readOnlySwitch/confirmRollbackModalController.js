'use strict';

require('app')
  .controller('ConfirmRollbackModalController', ConfirmRollbackModalController);

function ConfirmRollbackModalController(
  close,
  instance
) {
  this.instance = instance;
  this.actions = {
    confirm: function () {
      close(true);
    },
    cancel: function () {
      close(false);
    }
  };
}
