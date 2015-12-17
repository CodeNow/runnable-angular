'use strict';

require('app')
  .controller('ConfirmCloseServerController', ConfirmCloseServerController);

function ConfirmCloseServerController(
  close,
  instance
) {
  this.hasInstance = instance;
  this.actions = {
    goBack: function () {
      close();
    },
    discardChanges: function () {
      close(true);
    },
    saveAndBuild: function () {
      close('build');
    }
  };
}
