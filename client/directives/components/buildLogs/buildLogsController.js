'use strict';

require('app').controller('BuildLogsController', BuildLogsController);
//var DEFAULT_ERROR_MESSAGE = '\x1b[33;1mLogs are unavailable at this time\x1b[0m';

function BuildLogsController(
  streamingLog,
  $scope,
  primus
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
}