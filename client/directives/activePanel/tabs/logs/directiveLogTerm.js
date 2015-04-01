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
      var terminal = helperSetupTerminal($scope, elem, resizeHandler);
      $scope.$watch('item.state.active', resizeHandler);

      bind(primus, 'offline', function () {
        terminal.writeln('');
        terminal.writeln('☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹');
        terminal.writeln('☹ LOST CONNECTION - retrying ☹');
        terminal.writeln('☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹☹');
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
          $scope.stream.removeAllListeners();
          $scope.stream.end();
        }
        if ($scope.eventStream) {
          $scope.eventStream.removeAllListeners();
          $scope.eventStream.end();
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

      function initializeStream() {
        killCurrentStream();
        $scope.createStream();
        $scope.connectStreams(terminal);
        showTerminalSpinner();
        bind(primus, 'reconnected', function () {
          terminal.writeln('★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★');
          terminal.writeln('★ Connection regained.  Thank you for your patience ★');
          terminal.writeln('★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★');
        });
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
