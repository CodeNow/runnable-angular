require('app')
  .filter('unaddedRepos', unaddedRepos);
/**
 * @ngInject
 */
function unaddedRepos (
  hasKeypaths
) {
  return function (repos, appCodeVersions) {
    if (!appCodeVersions) { return repos; }
    return repos.filter(function (repo) {
      return !~appCodeVersions.findIndex(hasKeypaths({ 'attrs.repo': repo.attrs.full_name }));
    });
  };
}