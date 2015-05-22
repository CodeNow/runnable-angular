'use strict';

require('app')
  .filter('allBut', allBut);

// Filters out all repos that don't match
function allBut(hasKeypaths) {
  return function (inputData, reposToFilter) {
    if (!inputData || !inputData.length) { return []; }
    return inputData.filter(function (datum) {
      return !reposToFilter.find(hasKeypaths({
        name: datum.attrs.name
      }));
    });
  };
}