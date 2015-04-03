'use strict';

require('app')
  .controller('TermController', TermController);
/**
 * @ngInject
 */
function TermController(
  $scope,
  primus
) {
  var uniqueId;
  var termOnFn;
  var streamOnFn;
  $scope.termOpts = {
    hideCursor: false,
    cursorBlink: true
  };
  $scope.$watch('instance.containers.models[0].running()', function (n) {
    if (!n) { return; }
    $scope.$emit('STREAM_START', null, true);
  });

  $scope.createStream = function () {
    var streams = primus.createTermStreams($scope.instance.containers.models[0], uniqueId);
    uniqueId = streams.uniqueId;
    $scope.stream = streams.termStream;
    $scope.eventStream = streams.eventStream;
  };
  $scope.disconnectStreams = function (terminal) {
    terminal.off('data', termOnFn);
    $scope.stream.off('data', streamOnFn);
  };

  $scope.connectStreams = function (terminal) {
    termOnFn = $scope.stream.write.bind($scope.stream);
    streamOnFn = terminal.write.bind(terminal);
    terminal.on('data', termOnFn);
    $scope.stream.on('data', streamOnFn);
  };
}



