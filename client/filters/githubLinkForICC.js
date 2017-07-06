'use strict';

require('app')
  .filter('githubLinkForICC', githubLinkForICC);

function githubLinkForICC(
  configGithubHttpUrl
) {
  return function (inputClusterConfig) {
    if (!inputClusterConfig) {
      return '';
    }
    return configGithubHttpUrl + '/' + inputClusterConfig.repo + '/blob/' + inputClusterConfig.branch + inputClusterConfig.files[0].path;
  };
}
