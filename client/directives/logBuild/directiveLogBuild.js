'use strict';

require('app')
  .directive('logBuild', logBuild);
/**
 * @ngInject
 */
function logBuild(
  helperSetupTerminal,
  primus,
  keypather,
  $log,
  $stateParams,
  dockerStreamCleanser,
  fetchInstances
) {
  return {
    restrict: 'A',
    scope: {},
    link: function ($scope, elem, attrs) {
      var DEFAULT_ERROR_MESSAGE = '\x1b[33;1mbuild failed\x1b[0m';
      var DEFAULT_INVALID_BUILD_MESSAGE = '\x1b[31;1mPlease build again\x1b[0m';
      var COMPLETE_SUCCESS_MESSAGE = 'Build completed, starting instance...';

      /**
       * Creates instance of Terminal w/ default
       * settings and attaches to elem.
       * - Unbinds events on $destroy
       */
      var terminal = helperSetupTerminal($scope, elem);

      bind(primus, 'offline', function () {
        terminal.writeln('');
        terminal.writeln('******************************');
        terminal.writeln('* LOST CONNECTION - retrying *');
        terminal.writeln('******************************');
      });

      $scope.$on('$destroy', function () {
        if (!$scope.buildStream) { return; }
        $scope.buildStream.removeAllListeners();
        $scope.buildStream.end();
      });

      fetchInstances({
        name: $stateParams.instanceName
      }).then(function(instance) {
        $scope.instance = instance;
      });

      $scope.$watch('instance.build.attrs.id', function (n) {
        if (!n) { return; }
        initializeBuildLogs($scope.instance.build);
      });

      function killCurrentBuildStream() {
        if ($scope.buildStream) {
          $scope.buildStream.removeAllListeners();
          $scope.buildStream.end();
        }
      }

      /**
       * helper to always unbind on $destroy
       */
      function bind(obj, event, fn) {
        obj.on(event, fn);
        $scope.$on('$destroy', function () {
          obj.off(event, fn);
        });
      }

      function writeToTerm(output) {
        if (typeof output !== 'string') { return; }
        terminal.write(output.replace(/\r?\n/g, '\r\n'));
      }

      function showTerminalSpinner() {
        terminal.hideCursor = false;
        terminal.cursorBlink = true;
        terminal.cursorSpinner = true;

        if (terminal.cursorState === 0) {
          terminal.cursorState = -1;
        }
        terminal.startBlink();
      }

      function subscribeToSubstream(build) {
        //TODO spinner
        $scope.buildStream = primus.createBuildStream(build);
        // binds to $scope.buildStream.on('data')
        // important to unbind 'data' listener
        // before reinvoking this
        dockerStreamCleanser.cleanStreams($scope.buildStream,
                                          terminal,
                                          'hex',
                                          true);
      }

      function initializeBuildStream(build) {
        killCurrentBuildStream();
        subscribeToSubstream(build);
        showTerminalSpinner();
        bind(primus, 'reconnect', function () {
          subscribeToSubstream(build);
        });
        bind($scope.buildStream, 'end', function () {
          terminal.hideCursor = true;
          terminal.cursorBlink = false;
          terminal.cursorSpinner = false;
          terminal.cursorState = 0;
        });
      }

      function initializeBuildLogs(build) {
        terminal.reset();
        if (build.failed() || build.succeeded()) {
          var contextVersion = build.contextVersions.models[0];
          contextVersion.fetch(function (err, data) {
            if (err) { return $log.error(err); }
            if (build.succeeded()) {
              writeToTerm(data.build.log);
            }
            else if(build.failed()) {
              // defaulting behavior selects best avail error msg
              var cbBuild = keypather.get(contextVersion, 'attrs.build');
              var errorMsg = cbBuild.log || keypather.get(cbBuild, 'error.message') || DEFAULT_ERROR_MESSAGE;
              writeToTerm(errorMsg);
            }
          });
        } else {
          initializeBuildStream(build);
        }
      }

    }
  };
}
