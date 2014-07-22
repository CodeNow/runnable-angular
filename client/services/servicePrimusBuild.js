var primusClient = require('primus-client');
require('app')
  .factory('primusBuild', primusBuild);

/**
 * @ngInject
 */
function primusBuild(
  apiConfig
) {
  var args = JSON.stringify(apiConfig);

  return function (contextVersionId) {

    var url = apiConfig.host + ':' + apiConfig.proxyPort + '?type=build-stream&id=' + contextVersionId + '&args=' + args;

    var cache = '';

    var conn = new primusClient(url);

    conn.on('data', function (data) {
      cache += data;
    });

    return {
      connection: conn,
      getCache: function () {
        return cache;
      }
    };
  };
}
