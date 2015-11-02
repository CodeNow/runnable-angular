'use strict';

require('app')
  .factory('logHttpTid', logHttpTid);

function logHttpTid(configAPIHost) {
  function logResponse(response) {
    if (window.trackJs && response.config.url.indexOf(configAPIHost) === 0) {
      window.trackJs.console.info(response.config.method + ' ' + response.config.url + ' - ' + response.status + ' tid: ' + response.headers()['x-runnable-tid']);
    }
    return response;
  }
  return {
    response: logResponse,
    responseError: logResponse
  };
}
