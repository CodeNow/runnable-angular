'use strict';

require('app').controller('BuildLogsController', BuildLogsController);

function BuildLogsController(
  streamingLog,
  $scope,
  primus,
  errs,
  createDebugContainer
) {
  var BLC = this;
  BLC.buildLogsRunning = true;

  var stream = primus.createBuildStream(this.instance.build);
  stream.on('end', function () {
    BLC.buildLogsRunning = false;
  });
  var streamingBuildLogs = streamingLog(stream);
  $scope.$on('$destroy', function () {
    streamingBuildLogs.destroy();
  });
  this.buildLogs = streamingBuildLogs.logs;

  this.actions = {
    launchDebugContainer: function (event, command) {
      event.stopPropagation();
      createDebugContainer(BLC.instance.id(), BLC.instance.attrs.contextVersion._id, command.imageId)
        .then(function (debugContainer) {
          console.log(debugContainer);
        })
        .catch(errs.handler);
    }
  };
}