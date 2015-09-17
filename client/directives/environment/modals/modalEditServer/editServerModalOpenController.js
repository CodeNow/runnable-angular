'use strict';

require('app')
  .controller('EditServerModalOpenController', EditServerModalOpenController);

function EditServerModalOpenController(
  tab,
  instance,
  close
) {
  this.tab = tab;
  this.instance = instance;
  this.actions = {
    close: close
  };
}
