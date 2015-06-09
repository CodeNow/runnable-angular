'use strict';

require('app')
  .factory('helperCreateFS', helperCreateFS)
  .factory('helperCreateFSpromise', helperCreateFSpromise);
/**
 * @ngInject
 */
function helperCreateFS(
  errs,
  getNewFileFolderName,
  keypather
) {
  return function (dir, props, cb) {
    props.name = (props.name) ? props.name : getNewFileFolderName(dir, props.isDir);
    var fs = dir.contents.create(props, function () {
      keypather.set(fs, 'state.renaming', true);
      dir.contents.fetch(errs.handler);
      cb.apply(this, arguments);
    });
    return fs;
  };
}

function helperCreateFSpromise(
  errs,
  getNewFileFolderName,
  keypather,
  promisify
) {
  return function (dir, props) {
    props.name = (props.name) ? props.name : getNewFileFolderName(dir, props.isDir);
    return promisify(dir.contents, 'create')(props)
      .then(function (fs) {
        keypather.set(fs, 'state.renaming', true);
        return promisify(dir.contents, 'fetch');
      });
  };
}
