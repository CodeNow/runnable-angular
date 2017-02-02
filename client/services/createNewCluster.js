'use strict';

require('app')
  .factory('createNewCluster', createNewCluster);

function createNewCluster(
  $http,
  configAPIHost
) {
  return function (repo, branch, filePath, name) {
    var data = {
      repo: repo,
      branch: branch,
      filePath: filePath,
      name: name
    };

    return $http({
      method: 'post',
      url: configAPIHost + '/docker-compose-cluster',
      data: data
    });
  };
}
