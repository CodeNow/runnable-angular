'use strict';

require('app')
  .directive('term', term);
/**
 * term Directive
 * @ngInject
 */
function term(
  async,
  helperSetupTerminal,
  primus,
  jQuery,
  keypather,
  $stateParams,
  fetchInstances
) {
  return {
    restrict: 'E',
    scope: {
      item: '='
    },
    link: function ($scope, elem) {

      var streams, termStream, eventsStream;
      /**
       * creates instance of terminal w/ default
       * settings and attaches to elem.
       * - unbinds events on $destroy
       */
      var terminal = helperSetupTerminal($scope, elem, {
        hideCursor: false,
        cursorBlink: true
      }, function (x, y) {
        if (eventsStream) {
          eventsStream.write({
            event: 'resize',
            data: {
              x: x,
              y: y
            }
          });
        }
      });

      // monitor item, determine when terminal tab active, resize
      // to stop bug
      $scope.$watch('item.state.active', function () {
        jQuery(elem).trigger('resize');
      });

      fetchInstances({
        name: $stateParams.instanceName
      })
      .then(function(instance) {
        $scope.instance = instance;
      });

      bind(primus, 'offline', function () {
        terminal.writeln('');
        terminal.writeln('******************************');
        terminal.writeln('* LOST CONNECTION - retrying *');
        terminal.writeln('******************************');
      });

      /**
       * helper to always unbind on $destroy
       */
      function bind(obj, event, fn) {
        obj.on(event, fn);
        $scope.$on('$destroy', function () {
          obj.off(event, fn);
        });
      }

      $scope.$on('$destroy', function () {
        termStream.end();
        termStream.removeAllListeners();
      });

      function subscribeToSubstream(container) {
        if (termStream) {
          terminal.writeln('');
          terminal.writeln('Connection regained.  Thank you for your patience');
          terminal.removeAllListeners('data');
          termStream.removeAllListeners('data');
          terminal.reset();
        }
        // Initalize link to server
        streams      = primus.createTermStreams(container);
        termStream   = streams.termStream;
        eventsStream = streams.eventStream;

        // Client enters data into the system, which registers as data event on terminal
        // terminal then writes that to termStream, sending the data to the server
        // The server then responds (tab-complete, command output, etc)
        // The *response data* is what's eventually written to terminal.
        terminal.on('data', termStream.write.bind(termStream));
        termStream.on('data', terminal.write.bind(terminal));
      }

      $scope.$watch('instance.containers.models[0].running()', function (n) {
        if (!n) { return; }
        subscribeToSubstream($scope.instance.containers.models[0]);
      });

    }
  };
}
