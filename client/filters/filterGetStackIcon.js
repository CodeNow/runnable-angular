'use strict';

require('app')
  .filter('getStackIconFilter', getStackIconFilter);

function getStackIconFilter($sce) {
  return function (stackKey) {
    if (!stackKey) {
      return;
    }
    return $sce.trustAsResourceUrl('#icons-' + stackKey);
  };
}
