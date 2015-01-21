'use strict';

require('app')
  .factory('modelist', function ($window) {
    return $window.ace.acequire('ace/ext/modelist');
  });
