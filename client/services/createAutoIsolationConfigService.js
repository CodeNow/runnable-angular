'use strict';

require('app')
  .factory('createAutoIsolationConfig', createAutoIsolationConfig);

function createAutoIsolationConfig(
  fetchUser,
  promisify
) {
  return function (instance, dependencies) {
    return fetchUser().then(function (user) {
      var requestedDependencies = dependencies.map(function (dep) {
        if(dep.getRepoName()) {
          return {
            org: dep.attrs.owner.username,
            repo: dep.getRepoName(),
            instance: dep.id(),
            matchBranch: true
          };
        }
        return {
          instance: dep.id()
        };
      });

      return promisify(user, 'createAutoIsolationConfig')({
        instance: instance.id(),
        requestedDependencies: requestedDependencies
      });
    });
  };
}
