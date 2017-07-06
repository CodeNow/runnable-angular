'use strict';

require('app')
  .factory('composeCardActive', composeCardActive);

function composeCardActive(
  isInstanceActive,
  keypather,
  getPathShortHash
) {
  return function (composeCluster) {
    return isInstanceActive(composeCluster.master, composeCluster) ||
      keypather.get(composeCluster, 'clusters.length') ||
      getPathShortHash() === keypather.get(composeCluster, 'master.attrs.shortHash') ||
      isInstanceActive(keypather.get(composeCluster, 'testing[0]')) ||
      getPathShortHash() === keypather.get(composeCluster, 'testing[0].attrs.shortHash');
  };
}
