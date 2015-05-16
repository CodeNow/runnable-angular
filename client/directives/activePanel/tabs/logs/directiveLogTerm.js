'use strict';

require('app')
  .directive('logTerm', logTerm);
/**
 * @ngInject
 */
function logTerm(
  $timeout,
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
      function disconnected() {
        if (reconnecting) { return; }
        reconnecting = true;
        terminal.writeln('');
        terminal.writeln('☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹');
        terminal.writeln('☹ LOST CONNECTION - RETRYING ☹');
        terminal.writeln('☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹');
      }
      bind(primus, 'offline', disconnected);
      bind(primus, 'reconnect', disconnected);
      bind(primus, 'open', function () {
        if (!reconnecting) { return; }
        reconnecting = false;
        if ($scope.clearTermOnReconnect) {
          terminal.reset();
        }
        terminal.writeln('\n★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★');
        terminal.writeln('★ Connection regained.  Thank you for your patience ★');
        terminal.writeln('★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★\n');
        $timeout(function () {
          initializeStream(true);
        });
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

      function killCurrentStream() {
        if ($scope.stream) {
          $scope.stream.off('data');
          $scope.stream.removeAllListeners();
          $scope.stream.end();
        }
        if ($scope.eventStream) {
          $scope.eventStream.removeAllListeners();
          $scope.eventStream.end();
        }
        if (terminal) {
          terminal.off('data');
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

      function showTerminalSpinner(reconnecting) {
        if ($scope.showSpinnerOnStream) {
          terminal.cursorState = -1;
          terminal.hideCursor = false;
          terminal.cursorBlink = true;
          terminal.cursorSpinner = true;
          if (!reconnecting) {
            terminal.startBlink();
          }
        }
      }
      function hideTerminalSpinner() {
        if ($scope.showSpinnerOnStream) {
          terminal.hideCursor = true;
          terminal.cursorBlink = false;
          terminal.cursorSpinner = false;
          terminal.cursorState = 0;
          // Blur so that the cursor disappears
          terminal.refresh(terminal.y, terminal.y);
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

      function initializeStream(reconnecting) {
        killCurrentStream();
        $scope.createStream();
        $scope.connectStreams(terminal);
        showTerminalSpinner(reconnecting);

        bind($scope.stream, 'end', function () {
          hideTerminalSpinner();
          killCurrentStream();
          if ($scope.streamEnded) {
            $scope.streamEnded();
          }
        });
      }
    }
  };
}
