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
  primus,
  report
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
  $scope.$watch('instance.containers.models[0].running()', function (isRunning, wasRunning) {
    var container = keypather.get($scope, 'instance.containers.models[0]');
    if (!container) { return; }
    if (container.attrs.error || keypather.get(container, 'attrs.inspect.error')) {
      var error = keypather.get(container, 'attrs.inspect.error') || container.attrs.error;
      $scope.$emit('WRITE_TO_TERM', '\x1b[33;1m' + error.message + '\x1b[0m');
    } else if (container.attrs.dockerContainer) {
      // prepend log command to terminal
      var allCommands = (keypather.get(container, 'attrs.inspect.Config.Cmd') || []).join(' ');
      var doneWithSemi = 'done;';
      var firstDoneSemicolon = allCommands.indexOf(doneWithSemi);
      var cleanCommands = allCommands.substring(firstDoneSemicolon + doneWithSemi.length);
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
    if (container) {
      $scope.stream = primus.createLogStream(container);
    } else {
      report.warning('Attmpted to render box logs for an instance that doesn\'t have a container!', {
        instanceId: keypather.get($scope, 'instance.id()'),
        instanceStatus: keypather.get($scope, 'instance.status()')
      });
    }
  };

  $scope.$on('$destroy', function () {
    if (buffer && buffer.destroy) {
      buffer.destroy();
    }
  });
  $scope.connectStreams = function (terminal) {
    buffer = new streamBuffers.ReadableStreamBuffer({
      frequency: 250,      // in milliseconds.
      chunkSize: 16000     // in bytes.
    });
    buffer.setEncoding('utf8');
    primus.joinStreams(
      $scope.stream,
      through(
        function write(data) {
          buffer.put(data.toString().replace(/\r?\n/gm, '\r\n'));
        },
        buffer.destroySoon
      )
    );

    buffer.pipe(terminal, { end: false });
  };

  $scope.streamEnded = function () {
    // if this is called, then the container must have exited
    var container = $scope.instance.containers.models[0];
    buffer.on('close', function () {
      $scope.$emit('WRITE_TO_TERM', 'Exited with code: ' +
          keypather.get(container, 'attrs.inspect.State.ExitCode'));
    });
    buffer.destroySoon();
  };
}



