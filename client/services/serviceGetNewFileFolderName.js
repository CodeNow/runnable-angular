'use strict';

require('app')
  .factory('getNewFileFolderName', getNewFileFolderName);
/**
 * @ngInject
 */
function getNewFileFolderName() {
  return function (dir) {
    var regexp1 = /^undefined$/;
    var regexp2 = /^undefined \([0-9]+\)$/;

    var names = dir.contents.models
      .map(function (model) {
        return model.attrs.name;
      })
      .filter(function (name) {
        // verify model is correct type and has undefined name
        return regexp1.test(name) || regexp2.test(name);
      })
      .sort(function (m1, m2) {
        var n1 = m1.match(/[0-9]+/);
        var n2 = m2.match(/[0-9]+/);
        if (n1 === null) {
          n1 = ['0'];
        }
        if (n2 === null) {
          n2 = ['0'];
        }
        n1 = parseInt(n1[0]);
        n2 = parseInt(n2[0]);
        return n1 - n2;
      });
    // let would be nice
    var index = -1;
    for (var i = 0, len = names.length; i < len; i++) {
      if (names[i] === 'undefined') {
        index = 0;
      } else {
        index = parseInt(names[i].match(/[0-9]+/)[0]);
      }
      // find skipped indexes
      if (index > i) {
        index = i - 1;
        break;
      }
    }
    var name = 'undefined';
    index++;
    if (index > 0) {
      name += ' (' + index + ')';
    }
    return name;
  };
}
