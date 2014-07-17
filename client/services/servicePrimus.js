var primusClient = require('primus-client');
require('app')
  .factory('primus', primus);
  
/**
 * @ngInject
 */
function primus(
  apiConfig
) {
  var args = JSON.stringify(apiConfig);
  // FIXME this should all come from apiConfig
  var url = 'http://api.runnable3.net:3030?type=filibuster&args=' + args;
  
  var cache = '';
  
  var conn = new primusClient(url);
  
  var term = conn.substream('terminal');
  
  term.on('data', function(data) {
    cache += data;
  });
  
  return {
    connection: conn,
    getCache: function() { return cache; }
  };
}
