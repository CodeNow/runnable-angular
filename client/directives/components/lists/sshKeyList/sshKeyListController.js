'use strict';

require('app')
  .controller('SshKeyListController', SshKeyListController);
function SshKeyListController(
  $scope,
  currentOrg,
  sshKey,
  handleSocketEvent,
  github,
  keypather,
  fetchGitHubUserById
) {

  var SKLC = this;
  SKLC.hasKey = false;
  SKLC.keys = [];
  SKLC.githubLoading = false;
  SKLC.creatingKey = false;
  SKLC.authorized = false;
  SKLC.orgName = currentOrg.getDisplayName();

  function updateAuth() {
    return github.getGhScopes().then(function(scopes) {
      SKLC.authorized = scopes.indexOf('write:public_key') > -1 ;
    });
  }

  function createKey() {
    sshKey.saveSshKey()
      .then(function () {
        return handleSocketEvent('org.user.private-key.secured');
      })
      .then(getSshKeys)
      .finally(function() {
        SKLC.githubLoading = false;
        SKLC.creatingKey = false;
      });
  }

  $scope.$on('GH_SCOPE_UPGRADED', function () {
    updateAuth.then(SKLC.validateCreateKey);
  })

  updateAuth();

  function getSshKeys () {
    return sshKey.getSshKeys()
      .then(function (resp) {
        var ind = -1;
        SKLC.keys = keypather.get(resp, 'data.keys') || [];

        if (SKLC.keys.length) {
          SKLC.keys.forEach(function(key, i) {
            if (key.userId === keypather.get(currentOrg, 'poppa.user.attrs.bigPoppaUser.id')) {
              ind = i;
            }

            fetchGitHubUserById(key.githubUserId).then(function (ghUser) {
              key.userName = ghUser.login;
            });
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

  SKLC.validateCreateKey = function () {
    if (!SKLC.authorized) {
      SKLC.githubLoading = true;
      SKLC.creatingKey = true;
      github.upgradeGhScope();
    } else {
      createKey();
    }
  };
}
