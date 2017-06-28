'use strict';

require('app')
  .factory('createNewCluster', createNewCluster)
  .factory('redeployClusterMasterInstance', redeployClusterMasterInstance);

function createNewCluster(
  $http,
  configAPIHost
) {
  return function (repo, branch, filePath, name, githubId, clusterOpts) {
    var data = {
      repo: repo,
      branch: branch,
      filePath: filePath,
      name: name,
      githubId: githubId,
      isTesting: clusterOpts.isTesting,
      testReporters: clusterOpts.testReporters,
      parentInputClusterConfigId: clusterOpts.parentInputClusterConfigId,
      shouldNotAutoFork: clusterOpts.shouldNotAutoFork
    };
    return $http({
      method: 'post',
      url: configAPIHost + '/docker-compose-cluster',
      data: data
    });
  };
}

function redeployClusterMasterInstance(
  $http,
  configAPIHost
) {
  return function (instanceId) {
    var data = {
      instanceId: instanceId
    };
    return $http({
      method: 'POST',
      url: configAPIHost + '/docker-compose-cluster/redeploy',
      data: data
    });
  };
}
