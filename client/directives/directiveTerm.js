var Terminal = require('term.js');
require('app')
  .directive('term', term);
/**
 * term Directive
 * @ngInject
 */
function term(
  primus,
  $window
) {
  return {
    restrict: 'E',
    scope: {
      params: '='
    },
    link: function ($scope, elem) {
      // Numbers chosen erring on the side of padding
      var CHAR_WIDTH = 7.5;
      var CHAR_HEIGHT = 15.4;
      var termStream, clientEvents, terminal;
      var params = $scope.params;

      // Initalize link to server
      var streamId = params._id + '-' + Date.now();
      var primusTerm = primus({
        id: 1,
        event: 'terminal-stream',
        data: {
          dockHost: params.dockerHost,
          type: 'filibuster',
          containerId: params.dockerContainer,
          terminalStreamId: streamId,
          eventStreamId: streamId + 'events'
        }
      });

      function resizeTerm() {
        var x = Math.floor(terminal.element.scrollWidth / CHAR_WIDTH);
        var y = Math.floor(terminal.element.scrollHeight / CHAR_HEIGHT);

        terminal.resize(x, y);

        if (clientEvents) {
          clientEvents.write({
            event: 'resize',
            data: {
              x: x,
              y: y
            }
          });
        }
      }

      // Initalize Terminal
      terminal = new Terminal({
        cols: 80,
        rows: 24,
        useStyle: true,
        screenKeys: true
      });

      terminal.open(elem[0]);

      termStream = primusTerm.substream(streamId);

      // Client enters data into the system, which registers as data event on terminal
      // terminal then writes that to termStream, sending the data to the server
      // The server then responds (tab-complete, command output, etc)
      // The *response data* is what's eventually written to terminal.
      terminal.on('data', termStream.write.bind(termStream));
      termStream.on('data', terminal.write.bind(terminal));

      termStream.on('reconnect', function () {
        terminal.writeln('');
        terminal.writeln('Connection regained.  Thank you for your patience');
      });
      termStream.on('offline', function () {
        terminal.writeln('');
        terminal.writeln('******************************');
        terminal.writeln('* LOST CONNECTION - retrying *');
        terminal.writeln('******************************');
      });

      // Used for window resizing
      clientEvents = primusTerm.substream(streamId + 'events');

      resizeTerm();
      if (typeof window.onresize === 'function') {
        var oldResize = window.onresize;
        window.onresize = function () {
          oldResize();
          resizeTerm();
        };
      } else {
        window.onresize = resizeTerm;
      }

      $scope.$on('$destroy', function () {
        termStream.destroy();
        terminal.destroy();
      });
    }
  };
}
