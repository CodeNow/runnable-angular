'use strict';

require('app')
  .controller('ConfirmCloseServerController', ConfirmCloseServerController);

function ConfirmCloseServerController(
  close,
  hasInstance
) {
  this.hasInstance = hasInstance;
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
