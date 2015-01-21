'use strict';

require('app')
  .filter('errJSON', errJSON);

function errJSON () {
  // Lovingly borrowed from http://stackoverflow.com/a/20405830/1216976
  function stringifyError(err) {
    var plainObject = {};
    Object.getOwnPropertyNames(err).forEach(function(key) {
      plainObject[key] = err[key];
    });
    return JSON.stringify(plainObject);
  }

  return function (err) {
    if (!err) {
      return '';
    }
    if (err instanceof Error) {
      return stringifyError(err);
    }
    return JSON.stringify(err);
  };
}
