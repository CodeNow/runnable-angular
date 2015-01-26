'use strict';

require('app')
  .directive('logBuild', logBuild);
/**
 * @ngInject
 */
function logBuild(
  async,
  helperSetupTerminal,
  primus,
  keypather,
  $log,
  $stateParams,
  dockerStreamCleanser,
  createInstanceDeployedPoller,
  fetchInstances
) {
  return {
    restrict: 'A',
    scope: {},
    link: function ($scope, elem, attrs) {
      var DEFAULT_ERROR_MESSAGE = '\x1b[33;1mbuild failed\x1b[0m';
      var DEFAULT_INVALID_BUILD_MESSAGE = '\x1b[31;1mPlease build again\x1b[0m';
      var COMPLETE_SUCCESS_MESSAGE = 'Build completed, starting instance...';
      var instanceDeployedPoller;

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
        // stop polling for container success
        if (instanceDeployedPoller) {
          instanceDeployedPoller.clear();
        }
      });

      fetchInstances({
        name: $stateParams.instanceName
      })
      .then(function(instance) {
        $scope.instance = instance;
        initializeBuildLogs(instance.build);
      });

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
        terminal.cursorState = -1;
        terminal.startBlink();
      }

      function subscribeToSubstream(build) {
        if ($scope.buildStream) {
          $scope.buildStream.removeAllListeners('data');
          terminal.reset();
        }
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
          build.fetch(function (err) {
            if (err) { return $log.error(err); }
            if (!build.succeeded()) {
              writeToTerm(DEFAULT_INVALID_BUILD_MESSAGE);
            } else {
              writeToTerm(COMPLETE_SUCCESS_MESSAGE);
              instanceDeployedPoller = createInstanceDeployedPoller($scope.instance).start();
            }
          });
        });
      }

      function initializeBuildLogs(build) {
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
