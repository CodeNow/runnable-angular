'use strict';

require('app')
  .controller('BuildLogController', BuildLogController);
var DEFAULT_ERROR_MESSAGE = '\x1b[33;1mLogs are unavailable at this time\x1b[0m';
/**
 * @ngInject
 */
function BuildLogController(
  keypather,
  $scope,
  primus,
  promisify,
  streamBuffers,
  through,
  errs,
  $timeout
) {
  $scope.showSpinnerOnStream = true;
  $scope.clearTermOnReconnect = true;

  $scope.$watch('build.attrs.id', function (n) {
    if (n) {
      var build = $scope.build;
      if (build.failed() || build.succeeded()) {
        promisify(build.contextVersions.models[0], 'fetch')().then(function (data) {
          var cbBuild = keypather.get(data, 'attrs.build');
          if (build.succeeded() && cbBuild.log) {
            var log = cbBuild.log;
            if (Array.isArray(cbBuild.log)) {
              log = cbBuild.log.map(function (line) {
                if (line) {
                  return line.content;
                }
              }).join('\n');
            }
            $scope.$emit('WRITE_TO_TERM', log, true);
          } else {
            // defaulting behavior selects best avail error msg
            var errorMsg = cbBuild.log || DEFAULT_ERROR_MESSAGE;
            $scope.$emit('WRITE_TO_TERM', errorMsg, true);
          }
        }).catch(errs.handler);
      } else {
        $scope.$emit('STREAM_START', build, true);
      }
    }
  });

  var buffer;
  $scope.streamEnded = function () {
    $timeout(function () {
      $scope.build.fetch();
    }, 1000);
  };

  $scope.createStream = function () {
    $scope.stream = primus.createBuildStream($scope.build);
  };

  $scope.$on('$destroy', function () {
    if (buffer && buffer.destroy) {
      buffer.destroy();
    }
  });
  $scope.connectStreams = function (terminal) {
    buffer = new streamBuffers.ReadableStreamBuffer({
      frequency: 250,      // in milliseconds.
      chunkSize: 2048     // in bytes.
    });
    buffer.setEncoding('utf8');
    var newStream = through(
      function write(data) {
        var message = data ? (data.content + '\n' || data) : '';
        buffer.put(message.toString().replace(/\r?\n/gm, '\r\n'));
      },
      buffer.destroySoon
    );
    primus.joinStreams(
      $scope.stream,
      newStream
    );

    buffer.pipe(terminal, { end: false });
  };
}



