'use strict';

require('app')
  .factory('getPathShortHash', getPathShortHash);

function getPathShortHash ($state, keypather) {
  return function () {
    return keypather.get($state, 'params.instanceName.split(\'--\')[0]');
  };
}
