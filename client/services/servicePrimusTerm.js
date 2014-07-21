var primusClient = require('primus-client');
require('app')
  .factory('primusTerm', primusTerm);

/**
 * @ngInject
 */
function primusTerm(
  apiConfig
) {
  var args = JSON.stringify(apiConfig);

  var url = apiConfig.host + ':' + apiConfig.proxyPort + '?type=filibuster&args=' + args;

  var cache = '';

  var conn = new primusClient(url);

  var term = conn.substream('terminal');

  term.on('data', function (data) {
    cache += data;
  });

  return {
    connection: conn,
    getCache: function () {
      return cache;
    }
  };
}
