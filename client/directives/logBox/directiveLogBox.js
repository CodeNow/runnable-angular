require('app')
  .directive('logBox', logBox);
/**
 * @ngInject
 */
function logBox(
  async,
  helperSetupTerminal,
  primus,
  keypather,
  QueryAssist,
  $rootScope,
  $stateParams,
  dockerStreamCleanser,
  user
) {
  return {
    restrict: 'E',
    replace: true,
    scope: {},
    templateUrl: 'viewLogBox',
    link: function ($scope, elem, attrs) {

      var boxStream;

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
        if (!boxStream) return;
        boxStream.removeAllListeners();
        boxStream.end();
      });

      $scope.$watch('instance.containers.models[0].attrs.inspect.State.Running', function (n) {
        if (n === false) {
          var exitCode = $scope.container.attrs.inspect.State.ExitCode;
          if (exitCode > 0) {
            terminal.writeln('Exited with code: ' + exitCode);
          }
        }
      });

      async.series([
        fetchUser,
        fetchInstance
      ], function () {
        initializeBoxLogs($scope.instance.containers.models[0]);
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
        if (typeof output !== 'string') return;
        terminal.write(output.replace(/\r?\n/g, '\r\n'));
      }

      function subscribeToSubstream(container) {
        if (boxStream) {
          boxStream.removeAllListeners('data');
          terminal.reset();
        }
        //TODO spinner?
        boxStream = primus.createLogStream(container);
        // binds to boxStream.on('data')
        // important to unbind 'data' listener
        // before reinvoking this
        dockerStreamCleanser.cleanStreams(boxStream,
                                          terminal,
                                          'hex',
                                          true);
      }

      function initializeBoxLogs(container) {
        if (!container) throw new Error('no container');
        // prepend log command to terminal
        terminal.write('\x1b[33;1mroot@' + keypather.get($scope,
                       'container.attrs.inspect.Config.Hostname') +
                       '\x1b[0m: ' +
                       keypather.get($scope, 'instance.containers.models[0].attrs.inspect.Config.Cmd.join(" ")') +
                       '\n\r');
        subscribeToSubstream(container);
        bind(primus, 'reconnect', function () {
          subscribeToSubstream(container);
        });
      }

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

    }
  };
}
