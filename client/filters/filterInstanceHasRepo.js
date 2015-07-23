'use strict';

require('app')
  .filter('instanceHasRepo', instanceHasRepo);

function instanceHasRepo() {
  return function(instances, hasRepo) {
    if (!instances) {
      return;
    }
    return instances.filter(function (instance) {
      if (instance.destroyed || !instance.id()) {
        return false;
      }
      var repoExists = !!instance.getRepoName();
      return hasRepo === repoExists;
    });
  };
}