var Terminal = require('term.js');
var CHAR_HEIGHT = 20;
require('app')
  .directive('term', term);
/**
 * term Directive
 * @ngInject
 */
function term(
  primus,
  $window,
  debounce,
  jQuery
) {
  return {
    restrict: 'E',
    scope: {
      params: '='
    },
    link: function ($scope, elem) {
      $scope.$watch('params.running()', function (running) {
        if (!running) {
          return;
        }
        // Numbers chosen erring on the side of padding, will be updated with more accurate numbers later
        var params = $scope.params;
        var streams, termStream, clientEvents;

        // Initalize Terminal
        var terminal = new Terminal({
          cols: 80,
          rows: 24,
          useStyle: true,
          screenKeys: true
        });

        terminal.open(elem[0]);
        var $termElem = jQuery(terminal.element);

        function createSubstreams(reconnect) {
          if (reconnect) {
            terminal.removeAllListeners('data');
            termStream.removeAllListeners('data');
          }
          // Initalize link to server
          streams = primus.createTermStreams(params);
          termStream = streams.termStream;
          clientEvents = streams.eventStream;

          // Client enters data into the system, which registers as data event on terminal
          // terminal then writes that to termStream, sending the data to the server
          // The server then responds (tab-complete, command output, etc)
          // The *response data* is what's eventually written to terminal.
          terminal.on('data', termStream.write.bind(termStream));
          termStream.on('data', terminal.write.bind(terminal));
        }

        createSubstreams();
        function regainedMessage() {
          createSubstreams(true);
          terminal.writeln('');
          terminal.writeln('Connection regained.  Thank you for your patience');
        }
        primus.on('reconnect', regainedMessage);
        function offlineMessage() {
          terminal.writeln('');
          terminal.writeln('******************************');
          terminal.writeln('* LOST CONNECTION - retrying *');
          terminal.writeln('******************************');
        }
        primus.on('offline', offlineMessage);

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

        var dResizeTerm = debounce(resizeTerm, 300);

        dResizeTerm();
        jQuery($window).on('resize', dResizeTerm);
        terminal.on('focus', dResizeTerm);

        $scope.$on('$destroy', function () {
          termStream.end();
          terminal.destroy();
          terminal.removeAllListeners('data');
          termStream.removeAllListeners('data');
          terminal.removeAllListeners('end');
          termStream.removeAllListeners('end');
          primus.off('reconnect', regainedMessage);
          primus.off('offline', offlineMessage);
          jQuery($window).off('resize', dResizeTerm);
        });
      });
    }
  };
}
