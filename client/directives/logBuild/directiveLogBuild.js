'use strict';

require('app')
  .directive('logBuild', logBuild);
/**
 * @ngInject
 */
function logBuild(
  helperSetupTerminal,
  primus,
  dockerStreamCleanser
) {
  return {
    restrict: 'A',
    link: function ($scope, elem, attrs) {

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
        killCurrentStream();
      });

      $scope.$on('STREAM_START', function (event, newModel) {
        initializeBuildStream();
      });

      function connectStreams(stream) {
        dockerStreamCleanser.cleanStreams(stream,
          terminal,
          'hex',
          true);
      }

      function killCurrentStream() {
        if ($scope.stream) {
          $scope.stream.removeAllListeners();
          $scope.stream.end();
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

      function showTerminalSpinner() {
        if (!terminal.cursorSpinner && $scope.showSpinnerOnStream) {
          terminal.cursorState = -1;
          terminal.hideCursor = false;
          terminal.cursorBlink = true;
          terminal.cursorSpinner = true;
          terminal.startBlink();
        }
      }
      function hideTerminalSpinner() {
        if ($scope.showSpinnerOnStream) {
          terminal.hideCursor = true;
          terminal.cursorBlink = false;
          terminal.cursorSpinner = false;
          terminal.cursorState = 0;
        }
      }
      function writeToTerm(output) {
        if (typeof output !== 'string') { return; }
        terminal.write(output.replace(/\r?\n/g, '\r\n'));
      }

      $scope.$on('WRITE_TO_TERM', function (event, output, clearTerminal) {
        if (clearTerminal) {
          terminal.reset();
        }
        writeToTerm(output);
      });

      function initializeBuildStream() {
        killCurrentStream();
        var stream = $scope.createStream();
        connectStreams(stream);
        showTerminalSpinner();
        bind(primus, 'reconnect', function () {
          connectStreams(stream);
        });
        bind(stream, 'end', function () {
          hideTerminalSpinner();
          $scope.streamEnded();
        });
      }



    }
  };
}
