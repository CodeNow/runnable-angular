require('app')
  .filter('isFile', filterIsFile);
/**
 * @ngInject
 */
function filterIsFile() {
  return function (models) {
    return models.filter(function (model) {
      return !model.attrs.isDir;
    });
  };
}
