require('app')
  .factory('helperCreateFS', helperCreateFS);
/**
 * @ngInject
 */
function helperCreateFS(
  getNewFileFolderName,
  keypather,
  $rootScope
) {
  return function (dir, props, cb) {
    props.name = (props.name) ? props.name : getNewFileFolderName(dir);
    var fs = dir.contents.create(props, function () {
      keypather.set(fs, 'state.renaming', true);
      dir.contents.fetch(function (err) {
        $rootScope.safeApply();
        if (err) {
          throw err;
        }
      });
      cb.apply(this, arguments);
    });
    return fs;
  };
}
