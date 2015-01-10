'use strict';

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
      return ~commit.attrs.commit.message.toLowerCase().indexOf(filter) ||
        (commit.attrs.author && ~commit.attrs.author.login.toLowerCase().indexOf(filter)) ||
        ~commit.attrs.sha.toLowerCase().indexOf(filter);
    });
  };
}
