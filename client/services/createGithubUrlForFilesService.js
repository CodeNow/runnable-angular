'use strict';

require('app')
  .factory('createGithubUrlForFiles', createGithubUrlForFiles);

function createGithubUrlForFiles(
  keypather
) {
  return function (contextVersion, filePath) {
    var url = keypather.get(
      contextVersion,
      'appCodeVersions.models[0].githubRepo.branches.models[0].attrs.commit.url'
    );
    if (filePath && filePath[0] !== '/') {
      filePath = '/' + filePath;
    }
    if (url) {
      return url
          .replace('api.github.com/repos', 'github.com')
          .replace('/commits/', '/blob/') +
           filePath;
    }
  };
}
