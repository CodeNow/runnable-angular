'use strict';

require('app').controller('BuildLogsController', BuildLogsController);
//var DEFAULT_ERROR_MESSAGE = '\x1b[33;1mLogs are unavailable at this time\x1b[0m';

function BuildLogsController(
  streamingLog,
  $scope,
  primus
) {
  var stream = primus.createBuildStream(this.instance.build);
  var streamingBuildLogs = streamingLog(stream);
  $scope.$on('$destroy', function () {
    streamingBuildLogs.destroy();
  });
  this.buildLogs = streamingBuildLogs.logs;
}