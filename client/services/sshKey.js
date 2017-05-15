'use strict';

require('app')
  .factory('sshKey', sshKey);

function sshKey() {
  return {
    /**
     * Returns the current orgs ssh keys
     *
     * @returns {[*,*]}
     */
    getSshKeys: function () {
      var keysStub = [
        {username: 'Myztiq', fingerprint: '40:71:04:a8:3b:ea:a8:90:f6:99:6c:7a:22:f7:c0:15', avatar: 'https://avatars1.githubusercontent.com/u/495765'},
        {username: 'GingerbreadMan', fingerprint: 'e2:81:ae:03:43:1a:ba:cf:4e:e0:79:37:69:40:58:56', avatar: 'https://avatars1.githubusercontent.com/u/429706'}
      ];

      return keysStub;
    },

    /**
     * Sets the ssh key for the user and org combo. If the key exists it overrides it.
     *
     * @returns {{username: string, fingerprint: string, avatar: string}}
     */
    setSshKey: function() {
      var newKeyStub = {username: 'p4l-damien-20', fingerprint: 'e2:81:ae:03:43:1a:ba:cf:4e:e0:79:37:69:40:58:56', avatar: 'https://avatars1.githubusercontent.com/u/429706'}

      return newKeyStub;
    }
  }
}
