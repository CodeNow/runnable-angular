require('app')
  .filter('commitFilter', commitFilter);
/**
 * @ngInject
 */
function commitFilter(
  keypather
) {
  return function (commits, filter) {
    if (!filter) {
      return commits;
    }

    filter = filter.toLowerCase();

    return commits.filter(function (commit) {
      return ~commit.attrs.commit.message.toLowerCase().indexOf(filter) ||
        // attrs.author will == null for merge commits
        ~keypather.get(commit, 'attrs.author.login.toLowerCase().indexOf(filter)') ||
        ~commit.attrs.sha.toLowerCase().indexOf(filter);
    });
  };
}
