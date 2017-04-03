'use strict';

require('app')
  .factory('isInstanceActive', isInstanceActive);

function isInstanceActive(
  $state
) {
  return function (instance) {
    if (!instance) {
      return false;
    }
    var isCurrentBaseInstance = $state.is('base.instances.instance', {
      userName: instance.attrs.owner.username,
      instanceName: instance.attrs.name
    });

    if (isCurrentBaseInstance) {
      return true;
    }

    if (instance.containerHistory) {
      var isCurrentBaseTest = $state.is('base.instances.instance-test-sha', {
        userName: instance.attrs.owner.username,
        instanceName: instance.attrs.name,
        sha: instance.containerHistory.commitSha
      });

      if (isCurrentBaseTest) {
        return true;
      }
    }
    return false;
  };
}
