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
  
  // TODO: Vary port on environment
  var contextVersionId = 'llamas';
  var url = apiConfig.host + ':3030?type=build-stream&id=' + contextVersionId + '&args=' + args;

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
}
