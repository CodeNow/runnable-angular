'use strict';

require('app')
  .controller('SingleValueModalController', SingleValueModalController);

function SingleValueModalController(
  close
) {
  var MC = this;
  MC.confirm = function (savedValue) {
    close(savedValue);
  };
  MC.cancel = function () {
    close();
  };
}
