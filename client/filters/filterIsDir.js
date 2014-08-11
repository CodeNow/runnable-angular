require('app')
  .filter('isDir', filterIsDir);
/**
 * @ngInject
 */
function filterIsDir() {
  return function (models) {
    return models.filter(function (model) {
      return model.attrs.isDir;
    });
  };
}
