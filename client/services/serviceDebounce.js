'use strict';

var d = require('debounce');
require('app')
  .factory('debounce', debounce);

/**
 * service debounce
 * @ngInject
 */
function debounce() {
  return d;
}
