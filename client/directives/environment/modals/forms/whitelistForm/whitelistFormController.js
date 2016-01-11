'use strict';

require('app')
  .controller('WhitelistFormController', WhitelistFormController);

function WhitelistFormController() {
  var WFC = this;

  function resetForm() {
    WFC.isRange = false;
    WFC.fromAddress = '';
    WFC.toAddress = '';
    WFC.description = '';
  }

  WFC.whitelistEnabled = true;
  resetForm();

  WFC.actions = {
    add: function () {
      var address = [];
      address.push(WFC.fromAddress);
      if (WFC.isRange) {
        address.push(WFC.toAddress);
      }
      WFC.whitelist.push({
        address: address,
        description: WFC.description
      });
      resetForm();
    },
    remove: function (item) {
      var index = WFC.whitelist.indexOf(item);
      WFC.whitelist.splice(index, 1);
    }
  };
}
