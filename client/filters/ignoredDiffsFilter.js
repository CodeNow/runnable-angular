'use strict';

require('app')
  .filter('ignoredDiffs', ignoredDiffs);

// Filters out all repos that don't match
function ignoredDiffs(
) {
  return function (fileDiffs, acv) {
    if (!acv || !fileDiffs) { return fileDiffs; }
    return fileDiffs.filter(function (fileDiff) {
      return acv.attrs.transformRules.exclude.indexOf(fileDiff.from) === -1;
    });
  };
}