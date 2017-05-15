'use strict';

require('app')
  .controller('SshKeyListController', SshKeyListController);
function SshKeyListController(
  $q,
  currentOrg
) {
  var keysStub = [
    {username: 'Myztiq', fingerprint: '40:71:04:a8:3b:ea:a8:90:f6:99:6c:7a:22:f7:c0:15', avatar: 'https://avatars1.githubusercontent.com/u/495765'},
    {username: 'GingerbreadMan', fingerprint: 'e2:81:ae:03:43:1a:ba:cf:4e:e0:79:37:69:40:58:56', avatar: 'https://avatars1.githubusercontent.com/u/429706'}
  ];

  var newKeyStub = {username: 'p4l-damien-20', fingerprint: 'e2:81:ae:03:43:1a:ba:cf:4e:e0:79:37:69:40:58:56', avatar: 'https://avatars1.githubusercontent.com/u/429706'}

  var SKLC = this;
  SKLC.hasKey = false;
  SKLC.keys = [];
  SKLC.githubLoading = false;

  // TODO: Get keys call
  $q.when(keysStub)
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

    // TODO: Create key call
    $q.when(newKeyStub)
      .then(function(newKey) {
        SKLC.keys.splice(0, 0, newKey);
        SKLC.hasKey = true;
        SKLC.githubLoading = false;
      })
  }
}
