'use strict';

require('app')
  .factory('getNewFileFolderName', getNewFileFolderName);
/**
 * @ngInject
 */
function getNewFileFolderName() {
  return function (dir) {
    var genericFileName = 'newfile';
    var reg = new RegExp(genericFileName + '( [0-9]+)?');

    var nextNum = null;

    var exitedEarly = dir.contents.models
      .reduce(function(arr, model) {
        if (reg.test(model.attrs.name)) {
          arr.push(model.attrs.name);
        }
        return arr;
      }, [])
      .sort()
      .some(function(val, index) {
        nextNum = index;
        if (!index) {
          if (val !== genericFileName) {
            nextNum = null;
            return true;
          }
          return false;
        }
        if (val !== genericFileName + ' ' + (index - 1)) {
          return true;
        }
      });

    if (nextNum === null) {
      return genericFileName;
    }
    return genericFileName + ' ' + (exitedEarly ? nextNum - 1 : nextNum);
  };
}