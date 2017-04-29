'use strict';

require('app')
  .factory('privateRegistry', privateRegistry);

function privateRegistry(
  $http,
  configAPIHost,
  currentOrg,
  keypather
) {
  return {
    addRegistry: function (regUrl, username, password) {
      return $http({
        method: 'post',
        url: configAPIHost + '/organizations/' + currentOrg.poppa.id() + '/private-registry',
        data: {
          url: regUrl,
          username: username,
          password: password
        }
      });
    },
    getRegistryDetails: function() {
      var username = keypather.get(currentOrg, 'poppa.attrs.privateRegistryUsername');
      var url = keypather.get(currentOrg, 'poppa.attrs.privateRegistryUrl');

      if (username && url) {
        return {
          username: username,
          url: url
        };
      }

      return null;
    }
  };
}
