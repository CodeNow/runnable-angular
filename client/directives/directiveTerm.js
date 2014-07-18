var Terminal = require('term.js');
require('app')
  .directive('term', term);
/**
 * term Directive
 * @ngInject
 */
function term(
  primus
) {
  return {
    restrict: 'E',
    scope: {},
    link: function ($scope, elem, attrs) {
      // Numbers chosen erring on the side of padding
      var CHAR_WIDTH = 7.5;
      var CHAR_HEIGHT = 15.4;
      var termStream, clientEvents;
      
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
    terminal.write(primus.getCache());
    
      // Initalize link to server
      termStream = primus.connection.substream('terminal');
      
      termStream.on('reconnect', function() {
        terminal.writeln('');
        terminal.writeln('Connection regained.  Thank you for your patience');
      });
      termStream.on('offline', function() {
        terminal.writeln('');
        terminal.writeln('******************************');
        terminal.writeln('* LOST CONNECTION - retrying *');
        terminal.writeln('******************************');
      });
      
      // Used for window resizing
      clientEvents = primus.connection.substream('clientEvents');
      
      // Client enters data into the system, which registers as data event on terminal
      // terminal then writes that to termStream, sending the data to the server
      // The server then responds (tab-complete, command output, etc)
      // The *response data* is what's eventually written to terminal.
      terminal.on('data', termStream.write.bind(termStream));
      termStream.on('data', terminal.write.bind(terminal));
      
      resizeTerm();
      if (typeof window.onresize === 'function') {
        var oldResize = window.onresize;
        window.onresize = function() {
          oldResize();
          resizeTerm();
        };
      } else {
        window.onresize = resizeTerm;
      }
    }
  };
}
