'use strict';

require('app')
  .controller('ExpiredAccountController', ExpiredAccountController);

function ExpiredAccountController(
  close
) {
  var EAC = this;
  EAC.close = close;

  EAC.actions = {
    close: function () {
      close();
      console.log('Prevent close');
    },
    save: function () {
      console.log('SAVE');
    }
  };
}
