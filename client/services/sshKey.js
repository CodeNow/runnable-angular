'use strict';

require('app')
  .factory('sshKey', sshKey);

function sshKey(
  $http,
  configAPIHost,
  currentOrg
) {
  return {
    /**
     * Returns the current orgs ssh keys
     *
     * @returns {[*,*]}
     */
    getSshKeys: function () {
      return $http({
        method: 'get',
        url: configAPIHost + '/organizations/' + currentOrg.poppa.id() + '/ssh-key'
      });
    },

    /**
     * Saves the ssh key for the user and org combo. If the key exists it overrides it.
     *
     * @returns {{username: string, fingerprint: string, avatar: string}}
     */
    saveSshKey: function() {
      return $http({
        method: 'post',
        url: configAPIHost + '/organizations/' + currentOrg.poppa.id() + '/ssh-key'
      });
    }
  };
}
