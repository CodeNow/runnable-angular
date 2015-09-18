'use strict';

require('app')
  .factory('modelist', function ($window, $ocLazyLoad) {
    return $ocLazyLoad.load('ui.ace').then(function() {
      return $window.ace.acequire('ace/ext/modelist');
    });
  });
