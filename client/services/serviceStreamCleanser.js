'use strict';

require('app')
  .factory('dockerStreamCleanser', function () {
    return require('docker-stream-cleanser');
  });
