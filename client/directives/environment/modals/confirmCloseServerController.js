'use strict';

require('app')
  .controller('ConfirmCloseServerController', ConfirmCloseServerController);

function ConfirmCloseServerController(
  close,
  hasInstance,
  shouldDisableSave
) {
  this.hasInstance = hasInstance;
  this.shouldDisableSave = shouldDisableSave;
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
