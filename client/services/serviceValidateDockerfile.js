'use strict';

require('app')
  .factory('validateDockerfile', function () {
    return require('validate-dockerfile');
  });
