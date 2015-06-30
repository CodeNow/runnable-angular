'use strict';

require('app')
  .controller('BoxLogController', BoxLogController);
/**
 * @ngInject
 */
function BoxLogController(
  keypather,
  dockerStreamCleanser,
  $scope,
  through,
  streamBuffers,
  primus
) {

  $scope.clearTermOnReconnect = true;
  /**
   * watch for container changes - by watching running state
   * [Initial Scenarios:]
   * 1) container doesn't exist (build in progress or failed) - Running === undefined
   * 2) build finished, deployment completed
   *   A) container creation failed (container.error exists)  - Running === undefined
   *   B) container creation succeeded                        - Running !== undefined
   *     a) container is running                              - Running === true
   *     b) container is not running                          - Running === false
   * [Change Scenarios:]
   * 1) User stops container      - Running === false
   * 2) Container stops naturally - Running === true
   */
  $scope.$watch('instance.containers.models[0].running()', function () {
    var container = keypather.get($scope, 'instance.containers.models[0]');
    if (!container) { return; }
    if (container.attrs.error || keypather.get(container, 'attrs.inspect.error')) {
      var error = keypather.get(container, 'attrs.inspect.error') || container.attrs.error;
      $scope.$emit('WRITE_TO_TERM', '\x1b[33;1m' + error.message + '\x1b[0m');
    } else if (container.attrs.dockerContainer) {
      // prepend log command to terminal
      var cleanCommands = (keypather.get(container, 'attrs.inspect.Config.Cmd.join(" ")') || '')
        .replace('/bin/sh -c until grep -q ethwe /proc/net/dev; do sleep 1; done;', '');
      $scope.$emit('WRITE_TO_TERM',
        '\x1b[33;1mroot@' +
        keypather.get(container, 'attrs.inspect.Config.Hostname') +
        '\x1b[0m: ' +
        cleanCommands +
        '\n\r');
      // connect stream
      $scope.$emit('STREAM_START', container);
    } else {
      // Send error to Rollbar?
    }
  });


  var buffer;
  $scope.createStream = function () {
    var container = keypather.get($scope, 'instance.containers.models[0]');
    $scope.stream = primus.createLogStream(container);
  };

  $scope.$on('$destroy', function () {
    if (buffer && buffer.destroy) {
      buffer.destroy();
    }
  });
  $scope.connectStreams = function (terminal) {
    var streamCleanser = dockerStreamCleanser('hex');
    buffer = new streamBuffers.ReadableStreamBuffer({
      frequency: 250,      // in milliseconds.
      chunkSize: 2048     // in bytes.
    });
    buffer.setEncoding('utf8');
    primus.joinStreams(
      $scope.stream,
      streamCleanser
    )
      .pipe(through(
        function write(data) {
          buffer.put(data.toString().replace(/\r?\n/gm, '\r\n'));
        },
        buffer.destroySoon
      ));

    buffer.pipe(terminal);
  };

  $scope.streamEnded = function () {
    // if this is called, then the container must have exited
    var container = $scope.instance.containers.models[0];
    var exitCode = container.attrs.inspect.State.ExitCode;
    $scope.$emit('WRITE_TO_TERM', 'Exited with code: ' + exitCode);
    buffer.destroy();
  };

}



