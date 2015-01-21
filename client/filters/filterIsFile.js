'use strict';

require('app')
  .filter('isFile', filterIsFile);
/**
 * @ngInject
 */
function filterIsFile() {
  return function (models) {
    if (!models || !models.filter) {
      return [];
    }
    return models.filter(function (model) {
      return !model.attrs.isDir;
    });
  };
}
