'use strict';

require('app')
  .factory('PristineChecker', pristineCheckerFactory);

function pristineCheckerFactory(
  keypather
) {
  var _source = null;
  var cachedValues = {};

  function PristineChecker(source, pathsToWatch) {
    _source = source;
    if (!Array.isArray(pathsToWatch)) {
      throw new Error('pathsToWatch must be an array');
    }
    pathsToWatch.forEach(function (path) {
      cachedValues[path] = keypather.get(source, path);
    });
  }

  PristineChecker.prototype.isPristine = function () {
    return Object.keys(cachedValues).every(function (path) {
      return angular.equals(cachedValues[path], keypather.get(_source, path));
    });
  };

  return PristineChecker;

}
