var Terminal = require('term.js');
require('app')
  .directive('term', term);
/**
 * term Directive
 * @ngInject
 */
function term(
  Primus,
  apiConfig,
  streams
) {
  return {
    restrict: 'E',
    scope: {},
    link: function ($scope, elem, attrs) {
      var CHAR_WIDTH = 8.5;
      var CHAR_HEIGHT = 15;
      var args = JSON.stringify(apiConfig);
      var primus, termStream, clientEvents;
      
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

      // FIXME this should all come from apiConfig
      var url = 'http://api.runnable3.net:3030?type=filibuster&args=' + args;
      
      // Initalize Termal
      terminal = new Terminal({
        cols: 80,
        rows: 24,
        useStyle: true,
        screenKeys: true
      });
      
      function initalize() {
        // Initalize link to server
        console.log('Attempting to connect to ' + url + ' via Primus');
        primus = new Primus(url);
        termStream = primus.substream('terminal');
        
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
        clientEvents = primus.substream('clientEvents');
        
        terminal.on('data', termStream.write.bind(termStream));
        terminal.once('data', function(data) {
          clientEvents.emit('enableLog');
        });
        
        terminal.open(elem[0]);
        termStream.on('data', terminal.write.bind(terminal));
        terminal.end = terminal.destroy;
        
        resizeTerm();
        elem[0].onresize = resizeTerm;

        // Initalize client events
        var clientQuery = require('querystring').parse(window.location.search.slice(1));
        var clientOptions = clientQuery.options ? JSON.parse(clientQuery.options) : null;
        var clientArgs = clientOptions && clientOptions.args ? clientOptions.args : [];
        var clientEnv = clientOptions && clientOptions.env ? clientOptions.env : {};
        streams.emit.toStream(clientEvents).pipe(streams.json.stringify()).pipe(clientEvents);
      
        remoteResize = function (x, y) {
          clientEvents.emit('resize', x, y);
        };
        clientEvents.emit('startTerminal', clientArgs, clientEnv);
      }
      
      initalize();
    }
  };
}
