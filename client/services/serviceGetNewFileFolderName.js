'use strict';

require('app')
  .factory('getNewFileFolderName', getNewFileFolderName);
/**
 * @ngInject
 */
function getNewFileFolderName() {
  return function (dir, isDir) {
    var key = 'newFile';
    if (isDir) {
      key = 'newDirectory';
    }
    var newFileName = key;
    var count = 0;
    var filenames = dir.contents.models.map(function (model) { return model.attrs.name; });

    while (filenames.indexOf(newFileName) > -1){
      newFileName = key + ' ' + count;
      count += 1;
    }

    return newFileName;
  };
}