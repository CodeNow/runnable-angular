'use strict';

require('app')
  .factory('createNewCluster', createNewCluster);

function createNewCluster(
  $http,
  configAPIHost
) {
  return function (repo, branch, filePath, name, githubId, isTesting, testReporters, inputClusterConfigId) {
    var data = {
      repo: repo,
      branch: branch,
      filePath: filePath,
      name: name,
      githubId: githubId,
      isTesting: isTesting,
      testReporters: testReporters,
      inputClusterConfigId: inputClusterConfigId
    };
    return $http({
      method: 'post',
      url: configAPIHost + '/docker-compose-cluster',
      data: data
    });
  };
}
