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
    console.log(inputClusterConfig)
    return configGithubHttpUrl + '/' + inputClusterConfig.repo + '/blob/' + inputClusterConfig.branch + inputClusterConfig.filePath;
  };
}
