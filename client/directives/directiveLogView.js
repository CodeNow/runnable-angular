var Terminal = require('term.js');
var debounce = require('debounce');
var CHAR_HEIGHT = 20;
var streamCleanser = require('docker-stream-cleanser');
require('app')
  .directive('logView', logView);
/**
 * @ngInject
 */
function logView(
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
    templateUrl: 'viewLogView',
    link: function ($scope, elem, attrs) {
      var terminal = new Terminal({
        cols: 80,
        rows: Math.floor(elem[0].clientHeight/CHAR_HEIGHT),
        useStyle: true,
        screenKeys: true,
        scrollback: 0,
        hideCursor: true,
        cursorHidden: true,
        wraparoundMode: true,
        cursorState: 0
      });
      terminal.open(elem[0]);

      $scope.stream = {
        data: ''
      };
      // Terminal sizing
      var $termElem = jQuery(terminal.element);
      function resizeTerm() {
        // Tab not selected
        if ($termElem.width() === 100) { return; }
        var termLineEl = $termElem.find('div')[0];
        if (!termLineEl) { return; }
        var tBox = termLineEl.getBoundingClientRect();

        var charWidth = tBox.width / termLineEl.textContent.length;

        var x = Math.floor($termElem.width() / charWidth);
        if (x < 80) { x = 80; }
        var y = Math.floor($termElem.height() / CHAR_HEIGHT);
        terminal.resize(x, y);
      }
      var dResizeTerm = debounce(resizeTerm, 300);
      dResizeTerm();

      jQuery($window).on('resize', dResizeTerm);
      terminal.on('focus', dResizeTerm);

      $scope.$on('$destroy', function () {
        if ($scope.buildStream) {
          $scope.buildStream.end();
          $scope.buildStream = null;
        }
        terminal.off('focus', dResizeTerm);
        jQuery($window).off('resize', dResizeTerm);
        terminal.destroy();
      });

      // Getting data to Term
      function writeToTerm (data) {
        data = data.replace(/\r?\n/g, '\r\n');
        terminal.write(data);
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
                // red text, last ascii escape resets red.
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
          var buildStream = primus.createBuildStream($scope.build);
          $scope.buildStream = buildStream;
          streamCleanser.cleanStreams(buildStream, terminal, 'hex', true);
          buildStream.on('end', function () {
            build.fetch(function (err) {
              if (err) {
                throw err;
              }
              if (!build.succeeded()) {
                // bad things happened
                writeToTerm('please build again');
              } else {
                // we're all good
                writeToTerm('Build completed, starting instance...');
              }
            });
          });
        };

      } else if (attrs.container) {
        var initBoxStream = function () {
          var boxStream = primus.createLogStream($scope.container);
          streamCleanser.cleanStreams(boxStream, terminal, 'hex', true);

        };
        $scope.$watch('container.attrs._id', function (containerId) {
          if (containerId) {
            // prepend log command to terminal
            terminal.write('\x1b[33;1mroot@'+keypather.get($scope, 'container.attrs.inspect.Config.Hostname')+'\x1b[0m: ' + keypather.get($scope, 'container.attrs.inspect.Config.Cmd.join(" ")') + '\n\r');
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
