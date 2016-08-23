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
  if (!$scope.tabItem) {
    $scope.tabItem = {
      attrs: {
        terminalId: null
      },
      state: {
        saveState: function() {return null;}
      }
    };
  }

  var termOnFn;
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
        $scope.tabItem.state.saveState();
      }
    }
    primus.on('data', checkForTerminalCreation);
  };

  var hasHandledReconnection = true;
  $scope.connectStreams = function (terminal) {
    termOnFn = $scope.stream.write.bind($scope.stream);
    terminal.on('data', termOnFn);
    $scope.stream.on('data', function (data) {
      // The backend will send the last message it had sent on re-connection (this handles reloading the page)
      // We don't want to show duplicate messages to the users so we hide this message.
      if (!hasHandledReconnection) {
        hasHandledReconnection = true;
        return;
      }
      terminal.write(data);
    });

  };

  $scope.disconnected = false;

  $scope.handleDisconnect = function () {
    $scope.disconnected = true;
    $scope.$applyAsync();
  };
  $scope.handleReconnect = function () {
    $scope.disconnected = false;
    hasHandledReconnection = false;
    $scope.$applyAsync();
  };
}



