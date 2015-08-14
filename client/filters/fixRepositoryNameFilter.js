'use strict';

require('app')
  .filter('fixRepositoryName', fixRepositoryName);

function fixRepositoryName() {
  return function (repoName) {
    var split = repoName.split('/');
    return split.length > 1 ? split[1] : repoName;
  };
}