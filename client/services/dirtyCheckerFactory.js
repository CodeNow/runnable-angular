'use strict';

require('app')
  .factory('DirtyChecker', dirtyCheckerFactory);

function dirtyCheckerFactory(
  keypather
) {
  var _source = null;
  var cachedValues = {};

  function DirtyChecker(source, pathsToWatch) {
    _source = source;
    if (!Array.isArray(pathsToWatch)) {
      throw new Error('pathsToWatch must be an array');
    }
    pathsToWatch.forEach(function (path) {
      cachedValues[path] = keypather.get(source, path);
    });
  }

  DirtyChecker.prototype.isDirty = function () {
    return !Object.keys(cachedValues).every(function (path) {
      return angular.equals(cachedValues[path], keypather.get(_source, path));
    });
  };

  return DirtyChecker;

}
