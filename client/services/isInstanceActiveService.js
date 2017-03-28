'use strict';

require('app')
  .factory('isInstanceActive', isInstanceActive);

function isInstanceActive(
  $state,
  getPathShortHash
) {
  return function (instance) {
    var isCurrentBaseInstance = $state.is('base.instances.instance', {
      userName: instance.attrs.owner.username,
      instanceName: instance.attrs.name
    });

    if (isCurrentBaseInstance) {
      return true;
    }

    // Determine if the instance name matches our shorthash?
    return getPathShortHash() === instance.attrs.shortHash;
  };
}
