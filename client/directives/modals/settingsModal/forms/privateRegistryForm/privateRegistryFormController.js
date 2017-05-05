'use strict';

require('app')
  .controller('PrivateRegistryFormController', PrivateRegistryFormController);

function PrivateRegistryFormController (
  privateRegistry,
  keypather,
  loading
) {
  var PRFC = this;
  PRFC.registryCredentials = privateRegistry.getRegistryDetails();
  PRFC.authorized = !!PRFC.registryCredentials;
  PRFC.invalidCredentials = false;
  PRFC.formReset = false;

  PRFC.verifyAndSave = function () {
    loading('privateRegistry',true);

    privateRegistry.addRegistry(PRFC.url, PRFC.username, PRFC.password)
      .then(function(response) {
        if (response.status !== 204) {
          PRFC.invalidCredentials = true;
          return;
        }

        PRFC.invalidCredentials = false;
        PRFC.authorized = true;
        PRFC.formReset = false;

        keypather.set(PRFC, 'registryCredentials.url', PRFC.url);
        keypather.set(PRFC, 'registryCredentials.username', PRFC.username);

        PRFC.url = null;
        PRFC.username = null;
        PRFC.password = null;
      }).finally(function() {
        loading('privateRegistry',false);
      });
  };

  // Set them back to a blank form, but leave the data in place since they may decide not to replace it.
  PRFC.changeRegistry = function () {
    PRFC.formReset = true;
  };
}
