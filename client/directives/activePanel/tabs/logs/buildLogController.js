'use strict';

require('app')
  .controller('BuildLogController', BuildLogController);
var DEFAULT_ERROR_MESSAGE = '\x1b[33;1mbuild failed\x1b[0m';
/**
 * @ngInject
 */
function BuildLogController(
  keypather,
  dockerStreamCleanser,
  $scope,
  primus,
  $log,
  promisify,
  through,
  errs
) {
  $scope.showSpinnerOnStream = true;

  $scope.$watch('build.attrs.id', function (n) {
    if (n) {
      var build = $scope.build;
      if (build.failed() || build.succeeded()) {
        promisify(build.contextVersions.models[0], 'fetch')().then(function (data) {
          var cbBuild = keypather.get(data, 'attrs.build');
          if (build.succeeded()) {
            $scope.$emit('WRITE_TO_TERM', cbBuild.log, true);
          } else {
            // defaulting behavior selects best avail error msg
            var errorMsg = cbBuild.log + '\n' + (keypather.get(cbBuild, 'error.message') || DEFAULT_ERROR_MESSAGE);
            $scope.$emit('WRITE_TO_TERM', errorMsg, true);
            // Add some fake newlines at the end for padding!
            $scope.$emit('WRITE_TO_TERM', '\r\n\r\n\r\n\r\n', false);
          }
        }).catch(errs.handler);
      } else {
        $scope.$emit('STREAM_START', build, true);
      }
    }
  });

  $scope.createStream = function () {
    $scope.stream = primus.createBuildStream($scope.build);
  };

  $scope.connectStreams = function (terminal) {
    var streamCleanser = dockerStreamCleanser('hex');
    primus.joinStreams(
      $scope.stream,
      streamCleanser
    ).pipe(through(
      function write(data) {
        this.emit('data', data.toString().replace(/\r?\n/gm, '\r\n'));
      },
      function end() {
        // Do nothing, especially don't pass it along to the terminal (You'll get an error)
      }
    )).pipe(terminal);
  };
}



