'use strict';

require('app')
  .factory('launchDebugContainer', launchDebugContainer);

function launchDebugContainer(
  errs,
  createDebugContainer,
  customWindowService
) {
  return function (instance, contextVersionId, imageId, rawCommand) {
    var newWindow = customWindowService('/loading');
    return createDebugContainer(instance, contextVersionId, imageId, rawCommand)
      .then(function (debugContainer) {
        if (newWindow) {
          newWindow.location = '/debug/' + debugContainer.id();
        }
      })
      .catch(function (err) {
        if(newWindow){
          newWindow.close();
        }
        errs.handler(err);
      });
  };
}

