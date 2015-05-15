'use strict';

require('app')
  .factory('getNewFileFolderName', getNewFileFolderName);
/**
 * @ngInject
 */
function getNewFileFolderName() {
  return function (dir) {
    var newFileName = 'newfile';
    var count = 0;
    var filenames = dir.contents.models.map(function (model) { return model.attrs.name; });

    while (filenames.indexOf(newFileName) > -1){
      newFileName = 'newfile ' + count;
      count++;
    }

    return newFileName;
  };
}