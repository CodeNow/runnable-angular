'use strict';

require('app')
  .factory('extendDeep', function () {
    return extendDeep;
  });

function extendDeep(dst) {
  angular.forEach(arguments, function (obj) {
    if (obj === dst) { return; }
    angular.forEach(obj, function (val, key) {
      if (angular.isObject(dst[key])) {
        extendDeep(dst[key], val);
      } else {
        dst[key] = val;
      }
    });
  });
  return dst;
}
