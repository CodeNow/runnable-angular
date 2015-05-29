'use strict';

require('app')
  .filter('fileGithubLinkUrl', fileGithubLinkUrl);

// Filters out all repos that don't match
function fileGithubLinkUrl(
  createGithubUrlForFiles
) {
  return function (filepath, contextVersion) {
    return createGithubUrlForFiles(contextVersion, filepath);
  };
}