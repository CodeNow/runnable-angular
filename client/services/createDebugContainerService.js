'use strict';

require('app')
  .factory('createDebugContainer', createDebugContainer);

function createDebugContainer(
  fetchUser,
  promisify
) {
  return function (instanceId, contextVersionId, layerId) {
    return fetchUser().then(function (user) {
      console.log(user);
      console.log(instanceId, contextVersionId, layerId);
      return promisify(user, 'createDebugContainer')({
        instance: instanceId,
        contextVersion: contextVersionId,
        layerId: layerId
      });
    });
  };
}
