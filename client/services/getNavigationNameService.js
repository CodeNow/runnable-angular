'use strict';

require('app')
  .factory('getNavigationName', getNavigationName);

function getNavigationName(
  $rootScope,
  getInstanceServiceName,
  keypather
) {
  return function (instance) {
    // This is a cluster!
    if (keypather.get(instance, 'attrs.inputClusterConfig._id') && $rootScope.featureFlags.composeNav) {
      return getInstanceServiceName(instance);
    }

    var branchName = instance.getBranchName();
    var preamble = '';
    if (instance.attrs.isTesting && !instance.attrs.masterPod) {
      preamble = instance.getMasterPodName() + '/';
    } else if (instance.attrs.masterPod && branchName) {
      preamble = instance.attrs.name + '/';
    }

    if (instance.attrs.isolated && !instance.attrs.isIsolationGroupMaster) {
      // If it's isolated and not the master we should first try to show the repo and branch name
      if (branchName) {
        return preamble + instance.getInstanceAndBranchName();
      }
      // If this is a non-repo container just show the name
      return preamble + instance.getName();
    }
    // If we have a branch show that
    if (branchName) {
      return preamble + branchName;
    }
    // This must be a non-repo container. Show the name.
    return preamble + instance.getName();
  };
}
