'use strict';

require('app')
  .service('uuid', function () {
    return require('node-uuid');
  });
