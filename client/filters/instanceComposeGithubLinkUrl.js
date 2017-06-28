'use strict';

require('app')
  .filter('instanceComposeGithubLinkUrl', instanceComposeGithubLinkUrl);

// Filters out all repos that don't match
function instanceComposeGithubLinkUrl(
  $rootScope,
  promisify,
  loading
) {
  return function (instance) {
    if (!instance) {
      return '';
    }
    var inputClusterConfig = instance.attrs.inputClusterConfig;
    var mainACV = instance.contextVersion.getMainAppCodeVersion();
    var loadingString = 'fetchGHLink-' + mainACV.attrs._id;
    if (!mainACV.githubRepo.attrs.html_url) {
      if (!$rootScope.isLoading[loadingString]) {
        loading.reset(loadingString);
        loading(loadingString, true);
        promisify(mainACV.githubRepo, 'fetch')()
          .then(function () {
            loading(loadingString, false);
          });
      }
      return '';
    }
    return mainACV.githubRepo.attrs.html_url  + '/blob/' + inputClusterConfig.branch + inputClusterConfig.filePath;
  };
}
