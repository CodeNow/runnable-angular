'use strict';

require('app')
  .controller('TermController', TermController);
/**
 * @ngInject
 */
function TermController(
  $scope,
  primus,
  $timeout
) {
  var uniqueId;
  var termOnFn;
  var streamOnFn;
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
      streamModel = $scope.instance.containers.models[0];
    } else if ($scope.debugContainer) {
      streamModel = $scope.debugContainer.attrs.inspect;
    }
    var streams = primus.createTermStreams(streamModel, uniqueId);
    uniqueId = streams.uniqueId;
    $scope.stream = streams.termStream;
    $scope.eventStream = streams.eventStream;
  };

  $scope.connectStreams = function (terminal) {
    termOnFn = $scope.stream.write.bind($scope.stream);
    streamOnFn = terminal.write.bind(terminal);
    terminal.on('data', termOnFn);
    $scope.stream.on('data', streamOnFn);
  };
}



