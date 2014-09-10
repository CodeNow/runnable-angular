require('app')
  .filter('commitFilter', commitFilter);
/**
 * @ngInject
 */
function commitFilter() {
  return function (commits, filter) {
    if (!filter) {
      return commits;
    }

    filter = filter.toLowerCase();

    return commits.filter(function (commit) {
      return ~commit.commit.message.toLowerCase().indexOf(filter) ||
        ~commit.author.login.toLowerCase().indexOf(filter) ||
        ~commit.sha.toLowerCase().indexOf(filter);
    });
  };
}