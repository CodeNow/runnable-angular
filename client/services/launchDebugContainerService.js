'use strict';

require('app')
  .factory('launchDebugContainer', launchDebugContainer);

function launchDebugContainer (
  errs,
  createDebugContainer
) {
  return function (instance, contextVersionId, imageId, rawCommand) {
    var topBar = window.outerHeight - window.innerHeight;
    var padding = 60;
    var width = window.innerWidth - padding - padding;
    var height = window.innerHeight - padding - padding - 50;
    var top = window.screenTop + padding + topBar;
    var left = window.screenLeft + padding;
    var newWindow = window.open('/loading', 'page', 'toolbar=0,scrollbars=1,location=0,statusbar=0,menubar=0,resizable=0,width='+width+',height='+height+',left='+left+',top='+top+',titlebar=yes');
    return createDebugContainer(instance, contextVersionId, imageId, rawCommand)
      .then(function (debugContainer) {
        if (newWindow) {
          newWindow.location = '/debug/'+debugContainer.id();
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

