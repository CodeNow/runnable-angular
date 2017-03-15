'use strict';

require('app')
  .factory('createNewCluster', createNewCluster);

function createNewCluster(
  $http,
  configAPIHost
) {
  return function (repo, branch, filePath, name, isTesting, testReporter) {
    var data = {
      repo: repo,
      branch: branch,
      filePath: filePath,
      name: name,
      isTesting: isTesting,
      testReporter: testReporter
    };
    return $http({
      method: 'post',
      url: configAPIHost + '/docker-compose-cluster',
      data: data
    });
  };
}
