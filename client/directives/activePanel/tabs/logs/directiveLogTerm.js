'use strict';

require('app')
  .directive('logTerm', logTerm);
/**
 * @ngInject
 */
function logTerm(
  helperSetupTerminal,
  primus
) {
  return {
    restrict: 'A',
    link: function ($scope, elem, attrs) {

      /**
       * Creates instance of Terminal w/ default
       * settings and attaches to elem.
       * - Unbinds events on $destroy
       */
      function resizeHandler(x, y) {
        if ($scope.eventStream) {
          $scope.eventStream.write({
            event: 'resize',
            data: {
              x: x,
              y: y
            }
          });
        }
      }
      var terminal = helperSetupTerminal($scope, elem, $scope.termOpts, resizeHandler);

      var reconnecting = false;
      bind(primus, 'offline', function () {
        if (reconnecting) { return; }
        reconnecting = true;
        terminal.writeln('');
        terminal.writeln('☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹');
        terminal.writeln('☹ LOST CONNECTION - RETRYING ☹');
        terminal.writeln('☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹');
      });
      bind(primus, 'open', function () {
        if (!reconnecting) { return; }
        reconnecting = false;
        if ($scope.clearTermOnReconnect) {
          terminal.reset();
        }
        terminal.writeln('\n★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★');
        terminal.writeln('★ Connection regained.  Thank you for your patience ★');
        terminal.writeln('★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★\n');
        initializeStream(true);
      });

      $scope.$on('$destroy', function () {
        killCurrentStream();
      });

      $scope.$on('STREAM_START', function (event, newModel, clearTerminal) {
        if (clearTerminal) {
          terminal.reset();
        }
        initializeStream();
      });

      function killCurrentStream(isReconnecting) {
        if ($scope.stream) {
          if ($scope.disconnectStreams) {
            $scope.disconnectStreams(terminal);
          }
          $scope.stream.removeAllListeners();
          if (!isReconnecting) {
            $scope.stream.end();
          }
          $scope.stream = null;
        }
        if ($scope.eventStream) {
          $scope.eventStream.removeAllListeners();
          if (!isReconnecting) {
            $scope.eventStream.end();
          }
          $scope.eventStream = null;
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
        if ($scope.showSpinnerOnStream && !terminal.cursorSpinner) {
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
          // Blur so that the cursor disappears
          terminal.blur();
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

      function initializeStream(isReconnecting) {
        killCurrentStream(isReconnecting);
        $scope.createStream();
        $scope.connectStreams(terminal);
        showTerminalSpinner();

        bind($scope.stream, 'end', function () {
          if (!reconnecting) {
            hideTerminalSpinner();
            killCurrentStream();
            if ($scope.streamEnded) {
              $scope.streamEnded();
            }
          }
        });
      }
    }
  };
}
