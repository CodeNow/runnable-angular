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

    return commits.filter(function (commit) {
      return ~commit.commit.message.indexOf(filter) ||
        ~commit.author.login.indexOf(filter) ||
        ~commit.sha.indexOf(filter);
    });
  };
}