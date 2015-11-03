'use strict';

require('app')
  .factory('logHttpTid', logHttpTid);

function logHttpTid(
  configAPIHost,
  $window,
  keypather
) {
  function logResponse(response) {
    if ($window.trackJs && (keypather.get(response, 'config.url') || '').indexOf(configAPIHost) === 0) {
      $window.trackJs.console.info(keypather.get(response, 'config.method') +
        ' ' +
        keypather.get(response, 'config.url') +
        ' - ' +
        response.status +
        ' tid: ' +
        (keypather.get(response, 'headers()') || {})['x-runnable-tid']);
    }
    return response;
  }
  return {
    response: logResponse,
    responseError: logResponse
  };
}
