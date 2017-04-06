'use strict';

require('app')
  .directive('logTerm', logTerm);
/**
 * @ngInject
 */
function logTerm(
  $timeout,
  helperSetupTerminal,
  keypather,
  primus
) {
  return {
    restrict: 'A',
    name: 'controller',
    replace: true,
    transclude: true,
    controller: '@',
    controllerAs: 'CTRL',
    scope: {
      instance: '=? instance',
      debugContainer: '=? debugContainer',
      tabItem: '=? tabItem'
    },
    link: function ($scope, elem, attrs) {
      /**
       * Creates instance of Terminal w/ default
       * settings and attaches to elem.
       * - Unbinds events on $destroy
       */
      function resizeHandler(x, y) {
        if ($scope.eventStream && $scope.eventStream.stream) {
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

      var $disconnected = null;
      $scope.$watch('disconnected', function (val) {
        if (val === true) {
          $disconnected = angular.element('<div class="views-toolbar text-overflow"><svg class="iconnables icons-lightning"><use xlink:href="#icons-lightning"></svg> Connection Lost! Retrying.</div>');
          angular.element(elem).prepend($disconnected);
        } else if ($disconnected) {
          $disconnected.remove();
        }
      });

      var reconnecting = false;
      function disconnected() {
        if (reconnecting) { return; }
        reconnecting = true;
        if ($scope.handleDisconnect) {
          terminal.hideCursor = true;
          $scope.handleDisconnect();
        } else {
          terminal.writeln('');
          terminal.writeln('* Lost Connection — Retrying… *');
        }
      }
      bind(primus, 'offline', disconnected);
      bind(primus, 'reconnect', disconnected);
      bind(primus, 'open', function () {
        if (!reconnecting) { return; }
        reconnecting = false;
        if ($scope.clearTermOnReconnect) {
          terminal.reset();
        }
        if ($scope.handleReconnect) {
          $scope.handleReconnect();
          terminal.hideCursor = false;
        } else {
          terminal.writeln('* Connection Regained — Thanks for your patience! *');
        }
        $timeout(function () {
          initializeStream(true);
        });
      });

      $scope.$on('$destroy', function () {
        killCurrentStream();
        if ($disconnected) {
          $disconnected.remove();
        }
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
        if (!keypather.get($scope, 'instance.containerHistory')) {
          $scope.createStream();
        } else {
          $scope.streamTestLogs();
        }
        // If we can't create a stream don't try again, let the user refresh to get it.
        // We should have reported the error already.
        if (!$scope.stream) {
          return;
        }
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
