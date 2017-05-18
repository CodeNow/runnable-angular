'use strict';

require('app')
  .controller('SshKeyListController', SshKeyListController);
function SshKeyListController(
  $q,
  currentOrg,
  sshKey,
  handleSocketEvent,
  github
) {

  var SKLC = this;
  SKLC.hasKey = false;
  SKLC.keys = [];
  SKLC.githubLoading = false;
  SKLC.creatingKey = false;
  SKLC.authorized = false;

  github.getGhScopes().then(function(scopes) {
    SKLC.authorized = scopes.indexOf('write:public_key') > -1 ;
  });

  function getSshKeys () {
    return sshKey.getSshKeys()
      .then(function (resp) {
        var ind = -1;

        SKLC.keys = resp.json.keys;
        if (SKLC.keys && SKLC.keys.length) {
          SKLC.keys.forEach(function(key, i) {
            if (key.username === currentOrg.github.oauthName()) {
              ind = i;
            }
          });
        }

        if (ind >= 0) {
          SKLC.hasKey = true;
          // move users key to front
          SKLC.keys.splice(0, 0, SKLC.keys.splice(ind,1)[0]);
        }
      });
  }

  getSshKeys();

  SKLC.createKey = function () {
    SKLC.githubLoading = true;
    SKLC.creatingKey = true;

    $q.when(SKLC.authorized)
      .then(function(hasScope) {
        if (!hasScope) {
          // TODO: Replace with get new permissions
          return $q.when()
            // .then(function (res) {
            //   return handleSocketEvent('todo-auth-update-event');
            // })
            .then(function() {
              SKLC.authorized = true;
            });
        }

        return;
      })
      .then(sshKey.saveSshKey())
      .then(function () {
         return handleSocketEvent('org.user.private-key.secured');
      })
      .then(getSshKeys)
      .finally(function() {
        SKLC.githubLoading = false;
        SKLC.creatingKey = false;
      });
  };
}
