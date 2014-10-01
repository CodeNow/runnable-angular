var Terminal = require('term.js');
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
        var charWidth = 8.3;
        var charHeight = 19;
        var params = $scope.params;

        // Initalize link to server
        var streams = primus.createTermStreams(params);
        var termStream = streams.termStream;
        var clientEvents = streams.eventStream;

        // Initalize Terminal
        var terminal = new Terminal({
          cols: 80,
          rows: 24,
          useStyle: true,
          screenKeys: true
        });

        terminal.open(elem[0]);
        var $termElem = jQuery(terminal.element);

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

        function resizeTerm() {
          // Tab not selected
          if ($termElem.width() === 100) { return; }
          var termLineEl = $termElem.find('span')[0];
          if (!termLineEl) { return; }
          var tBox = termLineEl.getBoundingClientRect();

          charHeight = tBox.height;
          charWidth = tBox.width / termLineEl.textContent.length;

          var x = Math.floor($termElem.width() / charWidth);
          var y = Math.floor($termElem.height() / charHeight);

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
          jQuery($window).off('resize', dResizeTerm);
        });
      });
    }
  };
}
