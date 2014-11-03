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
  keypather,
  QueryAssist,
  $rootScope,
  $stateParams,
  user
) {
  return {
    restrict: 'E',
    scope: {},
    link: function ($scope, elem) {

      var termStream;
      /**
       * creates instance of terminal w/ default 
       * settings and attaches to elem.
       * - unbinds events on $destroy
       */
      var terminal = helperSetupTerminal($scope, elem);

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

      function fetchUser(cb) {
        new QueryAssist(user, cb)
          .wrapFunc('fetchUser')
          .query('me')
          .cacheFetch(function (user, cached, cb) {
            $scope.user = user;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, user, cb) {})
          .go();
      }

      function fetchInstance(cb) {
        new QueryAssist($scope.user, cb)
          .wrapFunc('fetchInstances')
          .query({
            githubUsername: $stateParams.userName,
            name: $stateParams.instanceName
          })
          .cacheFetch(function (instances, cached, cb) {
            if (!cached && !instances.models.length) {
              return cb(new Error('Instance not found'));
            }
            var instance = instances.models[0];
            $scope.instance = instance;
            $scope.build = instance.build;
            $rootScope.safeApply();
          })
          .resolve(function (err, instances, cb) {
            var instance = instances.models[0];
            if (!keypather.get(instance, 'containers.models') || !instance.containers.models.length) {
              return cb(new Error('instance has no containers'));
            }
            $rootScope.safeApply();
            cb(err);
          })
          .go();
      }

      async.series([
        fetchUser,
        fetchInstance
      ], function () {
        initializeTerminal();
      });

      function initializeTerminal() {
      }
    }
  };
}


/*
      $scope.$watch('params.running()', function (running) {
        if (!running) {
          return;
        }
        // Numbers chosen erring on the side of padding, will be updated with more accurate numbers later
        var params = $scope.params;
        var streams, termStream, clientEvents;

        
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
*/
