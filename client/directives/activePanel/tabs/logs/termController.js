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

  $scope.connectStreams = function (terminal) {
    terminal.on('data', $scope.stream.write.bind($scope.stream));
    $scope.stream.on('data', terminal.write.bind(terminal));
  };
}



