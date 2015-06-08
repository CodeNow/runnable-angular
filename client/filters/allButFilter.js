'use strict';

require('app')
  .filter('allBut', allBut);

// Filters out all repos that don't match
function allBut() {
  return function (inputData, appCodeVersionsToFilter) {
    if (!inputData || !inputData.length || !appCodeVersionsToFilter) { return []; }
    return inputData.filter(function (datum) {
      return !appCodeVersionsToFilter.find(function (acv) {
        return acv.attrs.repo === datum.attrs.full_name;
      });
    });
  };
}