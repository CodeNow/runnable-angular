'use strict';

require('app')
  .controller('ConfirmationModalController', ConfirmationModalController);

function ConfirmationModalController(
  close
) {
  this.actions = {
    confirm: function () {
      close(true);
    },
    cancel: function () {
      close(false);
    }
  };
}
