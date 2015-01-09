'use strict';

require('app')
  .filter('isDir', filterIsDir);
/**
 * @ngInject
 */
function filterIsDir() {
  return function (models) {
    if (!models || !models.filter) {
      return [];
    }
    return models.filter(function (model) {
      return model.attrs.isDir;
    });
  };
}
