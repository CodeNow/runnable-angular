'use strict';

var runnable = window.runnable;

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