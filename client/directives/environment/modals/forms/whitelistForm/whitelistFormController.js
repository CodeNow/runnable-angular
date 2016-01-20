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

  var verificationPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  WFC.isFormValid = function () {
    if (!verificationPattern.test(WFC.fromAddress)) {
      return false;
    }
    if (WFC.isRange && !verificationPattern.test(WFC.toAddress)) {
      return false;
    }
    return true;
  };

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
