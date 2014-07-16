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
      var CHAR_WIDTH = 8.5;
      var CHAR_HEIGHT = 15;
      var termStream, clientEvents;
      
      $scope.loading = true;
      
      function resizeTerm() {
        // Any x value over 80 breaks newlines
        // https://github.com/chjj/term.js/issues/38
        var x = 80;
        var y = Math.floor(terminal.element.offsetHeight / CHAR_HEIGHT);
        terminal.resize(x, y);
        if (typeof remoteResize === 'function') {
          remoteResize(x, y);
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
      
      function initalize() {
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
        
        // Used for things like window resizing
        clientEvents = primus.connection.substream('clientEvents');
        
        // Client enters data into the system, which registers as data event on terminal
        // terminal then writes that to termStream, sending the data to the server
        // The server then responds (tab-complete, command output, etc)
        // The *response data* is what's eventually written to terminal.
        terminal.on('data', termStream.write.bind(termStream));
        termStream.on('data', terminal.write.bind(terminal));
        
        resizeTerm();
        elem[0].onresize = resizeTerm;

        remoteResize = function (x, y) {
          clientEvents.emit({
            event: 'resize',
            data: {
              x: x,
              y: y
            }
          });
        };
      }
      
      initalize();
    }
  };
}
