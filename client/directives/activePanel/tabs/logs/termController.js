'use strict';

require('app')
  .controller('TermController', TermController);
/**
 * @ngInject
 */
function TermController(
  $scope,
  primus,
  $timeout,
  WatchOnlyOnce
) {
  var termOnFn;
  var streamOnFn;
  var watchOnlyOnce = new WatchOnlyOnce($scope);
  $scope.termOpts = {
    hideCursor: false,
    cursorBlink: true
  };

  $timeout(function () {
    $scope.$emit('STREAM_START', null, true);
  });

  $scope.createStream = function () {
    var streamModel = null;
    if ($scope.instance) {
      streamModel = $scope.instance.attrs.container;
      if (!streamModel) {
        // If we don't have a container watch until we have one, when we do then create a stream
        return watchOnlyOnce.watchPromise('instance.attrs.container', $scope.createStream);
      }
    } else if ($scope.debugContainer) {
      streamModel = $scope.debugContainer.attrs.inspect;
    }
    var streams = primus.createTermStreams(streamModel, !!$scope.debugContainer, $scope.tabItem.attrs.terminalId);
    $scope.stream = streams.termStream;
    $scope.eventStream = streams.eventStream;

    function checkForTerminalCreation(streamData) {
      if (streamData.event === 'TERMINAL_STREAM_CREATED' && streamData.data.substreamId === streams.uniqueId) {
        $scope.tabItem.attrs.terminalId = streamData.data.terminalId;
        primus.off('data', checkForTerminalCreation);
      }
    }
    primus.on('data', checkForTerminalCreation);
  };

  $scope.connectStreams = function (terminal) {
    termOnFn = $scope.stream.write.bind($scope.stream);
    streamOnFn = terminal.write.bind(terminal);
    terminal.on('data', termOnFn);
    $scope.stream.on('data', streamOnFn);
  };
}



