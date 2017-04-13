'use strict';

require('app')
  .factory('getLatestCommitShaForInstance', getLatestCommitShaForInstance);
function getLatestCommitShaForInstance(
  $q,
  promisify,
  keypather,
  fetchCommitData,
  memoize
) {
  return function (instance) {
    var appCodeVersion = keypather.get(instance, 'contextVersion.getMainAppCodeVersion()');
    var branch = fetchCommitData.activeBranch(appCodeVersion);

    return $q.when()
      .then(function () {
        return memoize(
          function () {
            return promisify(branch.commits, 'fetch')();
          },
          function () {
            return keypather.get(appCodeVersion, 'attrs.commit') + keypather.get(branch, 'commits.models[0].attrs.sha');
          }
        )();
      })
      .then(function () {
        return keypather.get(branch, 'commits.models[0].attrs.sha');
      });
  };
}
