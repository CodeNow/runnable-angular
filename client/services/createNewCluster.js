'use strict';

require('app')
  .factory('createNewCluster', createNewCluster);

function createNewCluster(
  $http,
  configAPIHost
) {
  return function (repo, branch, filePath, name, isTesting, testReporters) {
    var data = {
      repo: repo,
      branch: branch,
      filePath: filePath,
      name: name,
      isTesting: isTesting,
      testReporters: testReporters
    };
    return $http({
      method: 'post',
      url: configAPIHost + '/docker-compose-cluster',
      data: data
    });
  };
}
