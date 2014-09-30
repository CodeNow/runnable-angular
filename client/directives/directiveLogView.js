var Terminal = require('term.js');
var debounce = require('debounce');
var CHAR_WIDTH = 8;
var CHAR_HEIGHT = 19;
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
  primus
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
        rows: 24,
        useStyle: true,
        screenKeys: true
      });
      terminal.open(elem[0]);

      $scope.stream = {
        data: ''
      };
      var $termElem = jQuery(terminal.element);
      var dResizeTerm = debounce(resizeTerm, 300);
      resizeTerm();
      jQuery($window).on('resize', dResizeTerm);
      terminal.on('focus', dResizeTerm);
      function writeToTerm (data) {
        data = data.replace(/\r?\n/g, '\r\n');
        terminal.write(data);
      }
      function resizeTerm() {
        // Tab not selected
        if ($termElem.width() === 100) { return; }
        var x = Math.floor($termElem.width() / CHAR_WIDTH);
        var y = Math.floor($termElem.height() / CHAR_HEIGHT);
        terminal.resize(x, y);
        terminal.refresh();
      }
      $scope.$on('$destroy', function () {
        if ($scope.buildStream) {
          $scope.buildStream.end();
          $scope.buildStream = null;
        }
        terminal.off('focus', dResizeTerm);
        jQuery($window).off('resize', dResizeTerm);
        terminal.destroy();
      });

      if (attrs.build) {
        $scope.$watch('build.attrs._id', function (buildId, oldVal) {
          terminal.reset();
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
                  'Unknown Build Error Occurred';
                writeToTerm(data);
              } else {
                writeToTerm('Unknown Build Error Occurred');
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
                writeToTerm('BUILD BROKEN: Please try again');
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
            initBoxStream();
          }
        });
      } else {
        throw new Error('improper use of directiveLogView');
      }

    }
  };
}
