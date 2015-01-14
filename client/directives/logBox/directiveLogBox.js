'use strict';

require('app')
  .directive('logBox', logBox);
/**
 * @ngInject
 */
function logBox(
  async,
  errs,
  helperSetupTerminal,
  primus,
  keypather,
  QueryAssist,
  fetchUser,
  $log,
  $rootScope,
  $stateParams,
  dockerStreamCleanser,
  user
) {
  return {
    restrict: 'A',
    scope: {},
    link: function ($scope, elem, attrs) {
      /**
       * Creates instance of Terminal w/ default
       * settings and attaches to elem.
       * - Unbinds events on $destroy
       */
      var terminal = helperSetupTerminal($scope, elem);

      bind(primus, 'offline', function () {
        terminal.writeln('');
        terminal.writeln('******************************');
        terminal.writeln('* LOST CONNECTION - retrying *');
        terminal.writeln('******************************');
      });

      $scope.$on('$destroy', function () {
        var boxStream = $scope.boxStream;
        if (!boxStream) { return; }
        boxStream.removeAllListeners();
        boxStream.end();
      });

      /**
       * watch for container changes - by watching running state
       * [Initial Scenarios:]
       * 1) container doesn't exist (build in progress or failed) - Running === undefined
       * 2) build finished, deployment completed
       *   A) container creation failed (container.error exists)  - Running === undefined
       *   B) container creation succeeded                        - Running !== undefined
       *     a) container is running                              - Running === true
       *     b) container is not running                          - Running === false
       * [Change Scenarios:]
       * 1) User stops container      - Running === false
       * 2) Container stops naturally - Running === true
       */
      $scope.$watch('instance.containers.models[0].running()', function () {
        var container = keypather.get($scope, 'instance.containers.models[0]');
        if (!container) { return; }
        if (container.attrs.dockerContainer) {
          // prepend log command to terminal
          terminal.write(
            '\x1b[33;1mroot@' +
            keypather.get(container, 'attrs.inspect.Config.Hostname') +
            '\x1b[0m: ' +
            keypather.get(container, 'attrs.inspect.Config.Cmd.join(" ")') +
            '\n\r');
          // connect stream
          subscribeToSubstream(container);
          bind(primus, 'reconnect', function () {
            subscribeToSubstream(container);
          });
        }
        else if (container.attrs.error) {
          terminal.writeln('\x1b[33;1m' + container.attrs.error.message + '\x1b[0m');
        }
      });

      // watch for container running changes
      $scope.$watch('boxStream.ended', function (boxStreamEnded) {
        var containerRunning = keypather.get($scope, 'instance.containers.models[0].running()');
        if (boxStreamEnded === true && containerRunning === false) {
          // if container stopped running
          var container = $scope.instance.containers.models[0];
          var exitCode = container.attrs.inspect.State.ExitCode;
          terminal.writeln('Exited with code: ' + exitCode);
        }
      });

      async.series([
        function (cb) {
          fetchUser(function(err, user) {
            if (err) { return cb(err); }
            $scope.user = user;
            cb();
          });
        },
        fetchInstance
      ], function (err) {
        if (err) { return $log.error(err); }
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

      function writeToTerm(output) {
        if (typeof output !== 'string') { return; }
        terminal.write(output.replace(/\r?\n/g, '\r\n'));
      }

      function subscribeToSubstream(container) {
        if ($scope.boxStream) {
          $scope.boxStream.removeAllListeners('data');
          terminal.reset();
        }
        //TODO spinner?
        $scope.boxStream = primus.createLogStream(container);
        // binds to boxStream.on('data')
        // important to unbind 'data' listener
        // before reinvoking this
        dockerStreamCleanser.cleanStreams($scope.boxStream, terminal, 'hex', true);
        // box log output ends... process exited
        $scope.boxStream.on('end', function () {
          $scope.boxStream.ended = true;
          fetchInstance(errs.handler);
        });
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
          })
          .resolve(function (err, instances, cb) {
            var instance = instances.models[0];
            // if (!keypather.get(instance, 'containers.models') || !instance.containers.models.length) {
            //   return cb(new Error('instance has no containers'));
            // }
            cb(err);
          })
          .go();
      }

    }
  };
}
