'use strict';

var runnable = new (require('runnable'))(window.host);

module.exports = function ($q) {
  return function () {
    var d = $q.defer();
    runnable.reset(mocks.user);
    d.resolve(runnable.newGithubRepos(mocks.repoList, {
      noStore: true
    }));
    return d.promise;
  };
};