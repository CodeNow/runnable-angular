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
  WatchOnlyOnce,
  $localStorage
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
    var localStorageId = null;
    if ($scope.instance) {
      streamModel = $scope.instance.attrs.container;
      if (!streamModel) {
        // If we don't have a container watch until we have one, when we do then create a stream
        return watchOnlyOnce.watchPromise('instance.attrs.container', $scope.createStream);
      }
      localStorageId = streamModel.dockerContainer;
    } else if ($scope.debugContainer) {
      streamModel = $scope.debugContainer.attrs.inspect;
      console.log(streamModel);
      localStorageId = streamModel.dockerContainer;
    }
    var localStorageKey = 'terminal-' + localStorageId;
    var streams = primus.createTermStreams(streamModel, undefined, !!$scope.debugContainer, $localStorage[localStorageKey]);
    $scope.stream = streams.termStream;
    $scope.eventStream = streams.eventStream;

    function checkForTerminalCreation(streamData) {
      if (streamData.event === 'TERMINAL_STREAM_CREATED' && streamData.data.substreamId === streams.uniqueId) {
        console.log('Terminal Connected', streamData.data);
        $localStorage[localStorageKey] = streamData.data.terminalId;
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



