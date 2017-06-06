'use strict';

require('app')
  .controller('SshKeyListController', SshKeyListController);
function SshKeyListController(
  $scope,
  $interval,
  currentOrg,
  sshKey,
  handleSocketEvent,
  github,
  keypather,
  fetchGitHubUserById,
  watchOncePromise,
  loading
) {
  var SKLC = this;
  SKLC.hasKey = false;
  SKLC.keys = [];
  SKLC.creatingKey = false;
  SKLC.authorized = false;
  SKLC.orgName = currentOrg.getDisplayName();
  SKLC.userName = keypather.get(currentOrg, 'poppa.user.attrs.accounts.github.username');

  updateAuth();
  getSshKeys();

  function updateAuth() {
    return github.getGhScopes()
      .then(function(scopes) {
        SKLC.authorized = scopes.indexOf('write:public_key') > -1 ;
      });
  }

  function createKey() {
    SKLC.creatingKey = true;

    return sshKey.saveSshKey()
      .then(function () {
        return handleSocketEvent('private-key-secured');
      })
      .then(getSshKeys)
      .finally(function () {
        SKLC.creatingKey = false;
      });
  }

  function getSshKeys () {
    return sshKey.getSshKeys()
      .then(function (resp) {
        var entry;
        var ind = -1;
        SKLC.keys = keypather.get(resp, 'data.keys') || [];

        SKLC.keys.forEach(function(key, i) {
          if (key.userId === keypather.get(currentOrg, 'poppa.user.attrs.bigPoppaUser.id')) {
            ind = i;
          }

          fetchGitHubUserById(key.githubUserId)
            .then(function (ghUser) {
              key.userName = ghUser.login;
            });
        });

        if (ind >= 0) {
          SKLC.hasKey = true;

          entry = SKLC.keys.splice(ind,1)[0];
          SKLC.keys.unshift(entry);
        }
      });
  }

  SKLC.validateCreateKey = function () {
    if (!SKLC.authorized) {
      loading('upgradedGithubPermissions', true);

      var childWindow = github.upgradeGhScope();
      SKLC.popupClosed = keypather.get(childWindow, 'closed');
      var popupCheck = $interval(function () {
        SKLC.popupClosed = keypather.get(childWindow, 'closed');
      }, 1000, 30);
      $scope.$on("$destroy", function() {
          $interval.cancel(popupCheck);
        }
      );

      return watchOncePromise($scope, 'SKLC.popupClosed', true)
        .then(function() {
          $interval.cancel(popupCheck);
        } )
        .then(updateAuth)
        .then(createKey)
        .finally(function() {
          loading('upgradedGithubPermissions', false);
        });
    } else {
      return createKey();
    }
  };
}
