'use strict';

require('app')
  .controller('SshKeyListController', SshKeyListController);
function SshKeyListController(
  $q,
  currentOrg,
  sshKey
) {

  var SKLC = this;
  SKLC.hasKey = false;
  SKLC.keys = [];
  SKLC.githubLoading = false;

  $q.when(sshKey.getSshKeys())
    .then(function (fetchedKeys) {
      var ind;

      SKLC.keys = fetchedKeys;
      ind = SKLC.keys.findIndex(function (key) {
        return key.username === currentOrg.github.oauthName();
      });

      if (ind >= 0) {
        SKLC.hasKey = true;
        // move users key to front
        SKLC.keys.splice(0, 0, SKLC.keys.splice(ind,1)[0]);
      }
    });

  SKLC.createKey = function () {
    SKLC.githubLoading = true;

    // TODO: Provide real scope check
    $q.when(true)
      .then(function(hasScope) {
        if (!hasScope) {
          // TODO: Replace with get new permissions
          return $q.when()
            .then(function () {
              SKLC.githubLoading = false;
            });
        }

        return;
      })
      .then(function() {
        return sshKey.setSshKey()
      })
      .then(function(newKey) {
        SKLC.keys.splice(0, 0, newKey);
        SKLC.hasKey = true;
      })
  }
}
