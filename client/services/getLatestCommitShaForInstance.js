'use strict';

require('app')
  .factory('getLatestCommitShaForInstance', getLatestCommitShaForInstance);
function getLatestCommitShaForInstance(
  $q,
  promisify,
  keypather,
  fetchCommitData
) {
  return function (instance) {
    var appCodeVersion = keypather.get(instance, 'contextVersion.getMainAppCodeVersion()');
    var branch = fetchCommitData.activeBranch(appCodeVersion);

    return $q.when()
      .then(function () {
        if (branch.commits.models.length === 0) {
          return promisify(branch.commits, 'fetch')();
        }
        return;
      })
      .then(function () {
        return keypather.get(branch, 'commits.models[0].attrs.sha');
      });
  };
}
