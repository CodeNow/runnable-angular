'use strict';

require('app')
  .factory('composeCardActive', composeCardActive);

function composeCardActive(
  isInstanceActive,
  keypather
) {
  return function (composeCluster) {
    return isInstanceActive(composeCluster.master) || isInstanceActive(keypather.get(composeCluster, 'testing[0]'));
  };
}
