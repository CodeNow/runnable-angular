'use strict';

var Convert = require('ansi-to-html');
var convert = new Convert();

require('app')
  .filter('buildStreamCleaner', filterBuildStreamCleaner);
/**
 * @ngInject
 */
function filterBuildStreamCleaner() {
  return function (data) {
    return (data) ? convert.toHtml(data) : '';
  };
}
