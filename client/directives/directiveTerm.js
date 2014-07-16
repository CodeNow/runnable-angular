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
  streams,
  away
) {
  return {
    restrict: 'E',
    scope: {},
    template: '<div ng-class="{focused: focused}" ng-focus="focused = true" ng-blur="focused = false" class="term-container">' +
                '' +/* loader here */
              '</div>',
    link: function ($scope, elem, attrs) {
      var CHAR_WIDTH = 8.5;
      var CHAR_HEIGHT = 15;
      var args = JSON.stringify(apiConfig);
      var firstLoad = true;
      var loading = true;
      var primus, terminal, termStream, clientEvents;
      
      function resizeTerm() {
        // Any x value over 80 breaks newlines
        var x = 80;
        var y = Math.floor(terminal.element.offsetHeight / CHAR_HEIGHT);
        console.log(x, y);
        terminal.resize(x, y);
        console.log(terminal.cols);
        if (typeof remoteResize === 'function') {
          remoteResize(x, y);
        }
      }
      
      function reactivateConnection() {
        console.log('RE');
        if (terminal) {
          try {
            elem.removeChild(terminal.element);
          }
          catch (err) {} // throws error if window.term.element has already been removed.
                         // which it has. term.js may change so handling both scenarios.
        }
        firstLoad = true;
        showLoader();
        setTimeout(initalize, 5000);
      }
      
      function closeConnection() {
        console.log('DIS');
        termStream.removeListener('end', reactivateConnection);
        termStream.end();
      }
      
      var timer = away(1000 * 60 * 10);
      timer.on('idle', closeConnection);
      timer.on('active', reactivateConnection);
      
      // FIXME this should all come from apiConfig
      var url = 'http://api.runnable3.net:3030?type=filibuster&args=' + args;
      
      function initalize() {
        // Initalize link to server
        console.log('Attempting to connect to ' + url + ' via Primus');
        primus = new Primus(url);
        termStream = primus.substream('terminal');
        
        termStream.on('end', reactivateConnection);
        termStream.on('connect', function() {
          $scope.loaded = true;
        });
        
        // Used for things like window resizing
        clientEvents = primus.substream('clientEvents');
        
        // Initalize Termal
        terminal = new Terminal({
          cols: 80,
          rows: 24,
          useStyle: true,
          screenKeys: true
        });
        
        terminal.on('data', termStream.write.bind(termStream));
        terminal.once('data', function(data) {
          clientEvents.emit('enableLog');
        });
        
        terminal.open(elem[0].firstChild);
        termStream.on('data', terminal.write.bind(terminal));
        terminal.end = terminal.destroy;
        
        resizeTerm();
        setTimeout(resizeTerm, 1000);
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
        setInterval(function ping () {
          clientEvents.emit('ping', true);
        }, 1000);
      }
      
      initalize();
    }
  };
}
