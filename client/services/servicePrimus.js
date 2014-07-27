var primusClient = require('primus-client');
require('app')
  .factory('primus', primus);

/**
 * @ngInject
 */
function primus(
  apiConfig
) {

    // TODO: remove proxy port
    var url = apiConfig.host + ':' + apiConfig.proxyPort;

    var conn = new primusClient(url);

    conn.on('data', function(data) {
      if (data.error) {
        throw data.error;
      }
    });

    return function createSubstream(config) {
      conn.write(config);

      return conn;
    };
}
