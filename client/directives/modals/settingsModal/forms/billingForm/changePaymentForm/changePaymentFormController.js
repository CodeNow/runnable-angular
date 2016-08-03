'use strict';

require('app')
  .controller('ChangePaymentFormController', ChangePaymentFormController);

function ChangePaymentFormController() {
  var CPFC = this;
  this.updating = this.updating === 'true'; //Coerce the value to a boolean

  CPFC.card = {};

  CPFC.actions = {
    save: function () {
      console.log('Save card', CPFC.card);
      CPFC.save();
    },
    back: function () {
      CPFC.back();
    },
    cancel: function () {
      CPFC.cancel();
    }
  };
}
