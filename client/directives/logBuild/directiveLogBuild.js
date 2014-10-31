var Terminal = require('term.js');
var debounce = require('debounce');
var CHAR_HEIGHT = 20;
var streamCleanser = require('docker-stream-cleanser');
require('app')
  .directive('logBuild', logBuild);
/**
 * @ngInject
 */
function logBuild(
  $rootScope,
  $filter,
  $timeout,
  jQuery,
  $sce,
  $window,
  primus,
  keypather
) {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      container: '=',
      build: '='
    },
    templateUrl: 'viewLogBuild',
    link: function ($scope, elem, attrs) {
      var terminal = new Terminal({
        cols: 80,
        rows: Math.floor(elem[0].clientHeight / CHAR_HEIGHT),
        useStyle: true,
        screenKeys: true,
        scrollback: 1000,
        wraparoundMode: true,
        hideCursor: true,
        cursorBlink: false
      });
      terminal.open(elem[0]);

      $scope.stream = {
        data: ''
      };
      // Terminal sizing
      var $termElem = jQuery(terminal.element);

      function resizeTerm() {
        // Tab not selected
        if ($termElem.width() === 100) {
          return;
        }
        var termLineEl = $termElem.find('div')[0];
        if (!termLineEl) {
          return;
        }
        var tBox = termLineEl.getBoundingClientRect();

        var charWidth = tBox.width / termLineEl.textContent.length;

        var x = Math.floor($termElem.width() / charWidth);
        if (x < 80) {
          x = 80;
        }
        var y = Math.floor($termElem.height() / CHAR_HEIGHT);
        terminal.resize(x, y);
      }

      function createBuildStream() {
        return primus.createBuildStream($scope.build);
      }

      function createLogStream() {
        return primus.createLogStream($scope.container);
      }
      var dResizeTerm = debounce(resizeTerm, 300);
      dResizeTerm();

      jQuery($window).on('resize', dResizeTerm);

      $scope.$on('$destroy', function () {
        if ($scope.buildStream) {
          primus.off('reconnect', createStreams(createBuildStream));
          $scope.buildStream.removeAllListeners('end');
          $scope.buildStream.removeAllListeners('data');
          $scope.buildStream.end();
          $scope.buildStream = null;
        }
        if ($scope.boxStream) {
          primus.off('reconnect', createStreams(createLogStream));
          $scope.boxStream.removeAllListeners('end');
          $scope.boxStream.removeAllListeners('data');
          $scope.boxStream.end();
          $scope.boxStream = null;
        }

        primus.off('offline', offlineMessage);
        jQuery($window).off('resize', dResizeTerm);
        terminal.destroy();
      });
      // Getting data to Term
      function writeToTerm(data) {
        if (data) {
          data = data.replace(/\r?\n/g, '\r\n');
          terminal.writeln(data);
        }
      }
      var stream;

      function offlineMessage() {
        terminal.writeln('');
        terminal.writeln('******************************');
        terminal.writeln('* LOST CONNECTION - retrying *');
        terminal.writeln('******************************');
      }
      primus.on('offline', offlineMessage);

      function showSpinner() {
        terminal.hideCursor = false;
        terminal.cursorBlink = true;
        terminal.cursorSpinner = true;
        terminal.cursorState = -1;
        terminal.startBlink();
      }

      function createStreams(createStreamMethod, shouldShowSpinner) {
        return function (reconnect) {
          if (reconnect) {
            stream.removeAllListeners('data');
            // since the streams will contain all of the logs from the beginning, we need to erase
            // everything in term
            terminal.reset();
          }
          if (shouldShowSpinner) {
            showSpinner();
          }
          // Initalize link to server
          stream = createStreamMethod();
          streamCleanser.cleanStreams(stream, terminal, 'hex', true);
          return stream;
        };
      }

      if (attrs.build) {
        $scope.$watch('build.attrs._id', function (buildId, oldVal) {
          if (!buildId) {
            return;
          }
          var build = $scope.build;
          if (build.succeeded()) {
            build.contextVersions.models[0].fetch(function (err, data) {
              if (err) {
                throw err;
              }
              writeToTerm(data.build.log);
            });
          } else if (build.failed()) {
            var contextVersion = build.contextVersions.models[0];
            contextVersion.fetch(function (err) {
              if (err) {
                throw err;
              }
              if (contextVersion && contextVersion.attrs.build) {
                var data = contextVersion.attrs.build.log ||
                  (contextVersion.attrs.build.error && contextVersion.attrs.build.error.message) ||
                  '\x1b[33;1mbuild failed\x1b[0m';
                writeToTerm(data);
              } else {
                // yellow text, last ascii escape resets yellow.
                writeToTerm('\x1b[33;1mbuild failed\x1b[0m');
              }
              $rootScope.safeApply();
            });
          } else { // build in progress
            initBuildStream();
          }
        });
        var initBuildStream = function () {
          var build = $scope.build;
          var buildStream = createStreams(createBuildStream, true)();
          $scope.buildStream = buildStream;
          primus.on('reconnect', createStreams(createBuildStream, true));
          buildStream.on('end', function () {
            terminal.hideCursor = true;
            terminal.cursorBlink = false;
            terminal.cursorSpinner = false;
            terminal.cursorState = 0;
            build.fetch(function (err) {
              if (err) {
                throw err;
              }
              if (!build.succeeded()) {
                // bad things happened
                writeToTerm('\x1b[31;1mPlease build again\x1b[0m');
              } else {
                // we're all good
                writeToTerm('Build completed, starting instance...');
              }
            });
          });
        };

      } else if (attrs.container) {
        var initBoxStream = function () {
          $scope.boxStream = createStreams(createLogStream)();
          primus.on('reconnect', createStreams(createLogStream));
        };
        $scope.$watch('container.attrs._id', function (containerId) {
          if (containerId) {
            // prepend log command to terminal
            terminal.write('\x1b[33;1mroot@' + keypather.get($scope,
                'container.attrs.inspect.Config.Hostname') + '\x1b[0m: ' +
              keypather.get($scope, 'container.attrs.inspect.Config.Cmd.join(" ")') + '\n\r');
            initBoxStream();
          }
        });
        // If the container stops, display exit code
        $scope.$watch('container.attrs.inspect.State.Running', function (n) {
          // Strict comparison to false to avoid falsy values
          if (n === false) {
            var exitCode = $scope.container.attrs.inspect.State.ExitCode;
            if (exitCode > 0) {
              terminal.writeln('Exited with code: ' + exitCode);
            }
          }
        });
      } else {
        throw new Error('improper use of directiveLogView');
      }

    }
  };
}
